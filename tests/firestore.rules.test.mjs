import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const projectId = 'demo-reserva-clara';
const rulesPath = resolve(process.cwd(), 'firestore.rules');
const portfolioPath = (userId, portfolioId) =>
  `users/${userId}/portfolios/${portfolioId}`;
const assetPath = (userId, assetId) => `users/${userId}/assets/${assetId}`;
const registryPath = (userId, identityKey) =>
  `users/${userId}/assetIdentities/${identityKey}`;
const transactionPath = (userId, portfolioId, transactionId) =>
  `users/${userId}/portfolios/${portfolioId}/transactions/${transactionId}`;

const validPortfolio = (name = 'Synthetic Portfolio') => ({
  name,
  baseCurrency: 'BRL',
  archivedAt: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const legacyPortfolio = (name = 'Legacy Portfolio') => ({
  name,
  baseCurrency: 'BRL',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const validAsset = (overrides = {}) => ({
  symbol: 'BOVA11',
  market: 'B3',
  assetType: 'etf',
  currency: 'BRL',
  identityKey: 'BOVA11~B3~etf~BRL',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

const validTransaction = (overrides = {}) => ({
  kind: 'buy',
  assetId: 'asset-a',
  quantity: '1.25',
  unitPrice: { currency: 'BRL', decimal: '100.5' },
  effectiveDate: '2026-01-15',
  createdAt: serverTimestamp(),
  ...overrides,
});

async function createAtomicAsset(firestore, assetId = 'asset-a', overrides = {}) {
  const asset = validAsset(overrides);
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, assetPath('user-a', assetId)), asset);
  batch.set(
    doc(firestore, registryPath('user-a', asset.identityKey)),
    { assetId },
  );
  await assertSucceeds(batch.commit());
}

async function createActivePortfolio(firestore, portfolioId = 'portfolio-a') {
  await assertSucceeds(
    setDoc(doc(firestore, portfolioPath('user-a', portfolioId)), validPortfolio()),
  );
}

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile(rulesPath, 'utf8'),
    },
  });
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

test.after(async () => {
  if (testEnv) {
    try {
      await testEnv.clearFirestore();
    } finally {
      await testEnv.cleanup();
    }
  }
});

test('owner can create, read, list, and update active Portfolio', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const reference = doc(firestore, portfolioPath('user-a', 'portfolio-a'));

  await assertSucceeds(setDoc(reference, validPortfolio()));

  const created = await assertSucceeds(getDoc(reference));
  assert.equal(created.exists(), true);
  assert.equal(created.data()?.name, 'Synthetic Portfolio');
  assert.equal(created.data()?.baseCurrency, 'BRL');
  assert.equal(created.data()?.archivedAt, null);
  assert.ok(created.data()?.createdAt instanceof Timestamp);
  assert.ok(created.data()?.updatedAt instanceof Timestamp);

  const listed = await assertSucceeds(
    getDocs(collection(firestore, 'users/user-a/portfolios')),
  );
  assert.equal(listed.size, 1);
  assert.equal(listed.docs[0].id, 'portfolio-a');

  await assertSucceeds(
    updateDoc(reference, {
      name: 'Updated Synthetic Portfolio',
      createdAt: created.data().createdAt,
      updatedAt: serverTimestamp(),
    }),
  );

  const updated = await assertSucceeds(getDoc(reference));
  assert.equal(updated.data()?.name, 'Updated Synthetic Portfolio');
  assert.equal(updated.data()?.archivedAt, null);
  assert.deepEqual(updated.data()?.createdAt, created.data()?.createdAt);
  assert.ok(updated.data()?.updatedAt instanceof Timestamp);

  await assertFails(
    updateDoc(reference, {
      name: 'Changed Created Timestamp',
      createdAt: Timestamp.now(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(reference, {
      name: 'Client Updated Timestamp',
      createdAt: updated.data().createdAt,
      updatedAt: Timestamp.now(),
    }),
  );

  await assertFails(deleteDoc(reference));
  const stillPresent = await assertSucceeds(getDoc(reference));
  assert.equal(stillPresent.exists(), true);
});

test('owner can archive and restore Portfolio, while delete stays denied', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const emptyReference = doc(firestore, portfolioPath('user-a', 'portfolio-empty'));
  const activeReference = doc(firestore, portfolioPath('user-a', 'portfolio-active'));
  const archivedReference = doc(
    firestore,
    portfolioPath('user-a', 'portfolio-archived'),
  );

  await assertSucceeds(setDoc(emptyReference, validPortfolio('Empty Fixture')));
  await assertSucceeds(setDoc(activeReference, validPortfolio('Active Fixture')));
  await assertSucceeds(
    setDoc(archivedReference, validPortfolio('Archived Fixture')),
  );

  await assertFails(deleteDoc(emptyReference));
  await assertFails(deleteDoc(activeReference));
  await assertFails(
    updateDoc(activeReference, {
      name: 'Archive With Unexpected Rename',
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  await assertSucceeds(
    updateDoc(archivedReference, {
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  const archived = await assertSucceeds(getDoc(archivedReference));
  assert.ok(archived.data()?.archivedAt instanceof Timestamp);
  await assertFails(deleteDoc(archivedReference));

  await assertSucceeds(
    updateDoc(archivedReference, {
      archivedAt: null,
      updatedAt: serverTimestamp(),
    }),
  );

  const restored = await assertSucceeds(getDoc(archivedReference));
  assert.equal(restored.data()?.archivedAt, null);
  assert.equal(restored.data()?.name, 'Archived Fixture');
});

test('legacy Portfolio without archivedAt reads as active and supports lifecycle', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const reference = doc(firestore, portfolioPath('user-a', 'portfolio-legacy'));

  await assertSucceeds(setDoc(reference, legacyPortfolio()));

  const legacy = await assertSucceeds(getDoc(reference));
  assert.equal(legacy.exists(), true);
  assert.equal(Object.hasOwn(legacy.data(), 'archivedAt'), false);

  await assertSucceeds(
    updateDoc(reference, {
      name: 'Renamed Legacy Portfolio',
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(reference, {
      name: 'Archive With Unexpected Rename',
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  await assertSucceeds(
    updateDoc(reference, {
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  const archived = await assertSucceeds(getDoc(reference));
  assert.ok(archived.data()?.archivedAt instanceof Timestamp);

  await assertSucceeds(
    updateDoc(reference, {
      archivedAt: null,
      updatedAt: serverTimestamp(),
    }),
  );
  const restored = await assertSucceeds(getDoc(reference));
  assert.equal(restored.data()?.archivedAt, null);
  assert.equal(restored.data()?.name, 'Renamed Legacy Portfolio');
  await assertFails(deleteDoc(reference));
});

test('users cannot read, write, or list another user namespace', async () => {
  const userA = testEnv.authenticatedContext('user-a').firestore();
  const userB = testEnv.authenticatedContext('user-b').firestore();
  const aReference = doc(userA, portfolioPath('user-a', 'portfolio-a'));
  const bReference = doc(userB, portfolioPath('user-b', 'portfolio-b'));

  await assertSucceeds(setDoc(aReference, validPortfolio('A Fixture')));
  await assertSucceeds(setDoc(bReference, validPortfolio('B Fixture')));

  await assertFails(
    getDoc(doc(userA, portfolioPath('user-b', 'portfolio-b'))),
  );
  await assertFails(
    getDocs(collection(userA, 'users/user-b/portfolios')),
  );
  await assertFails(
    setDoc(
      doc(userA, portfolioPath('user-b', 'portfolio-injected')),
      validPortfolio('Injected Fixture'),
    ),
  );
  await assertFails(
    deleteDoc(doc(userA, portfolioPath('user-b', 'portfolio-b'))),
  );
  await assertFails(
    updateDoc(doc(userA, portfolioPath('user-b', 'portfolio-b')), {
      name: 'Injected Update',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  const aList = await assertSucceeds(
    getDocs(collection(userA, 'users/user-a/portfolios')),
  );
  const bList = await assertSucceeds(
    getDocs(collection(userB, 'users/user-b/portfolios')),
  );
  assert.deepEqual(aList.docs.map(({ id }) => id), ['portfolio-a']);
  assert.deepEqual(bList.docs.map(({ id }) => id), ['portfolio-b']);
});

test('anonymous clients cannot read or write Portfolio', async () => {
  const firestore = testEnv.unauthenticatedContext().firestore();
  const reference = doc(firestore, portfolioPath('user-a', 'anonymous'));

  await assertFails(getDoc(reference));
  await assertFails(setDoc(reference, validPortfolio('Anonymous Fixture')));
});

test('invalid Portfolio schema is rejected', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const timestamp = Timestamp.now();
  const cases = [
    {
      name: 'missing required field',
      data: {
        name: 'Missing Timestamp',
        baseCurrency: 'BRL',
        createdAt: serverTimestamp(),
      },
    },
    {
      name: 'extra field',
      data: {
        ...validPortfolio('Extra Field'),
        unexpected: 'closed-schema',
      },
    },
    {
      name: 'invalid currency',
      data: {
        ...validPortfolio('Invalid Currency'),
        baseCurrency: 'USD',
      },
    },
    {
      name: 'timestamp not controlled by server',
      data: {
        ...validPortfolio('Client Timestamp'),
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    {
      name: 'timestamp with invalid type',
      data: {
        ...validPortfolio('Invalid Timestamp Type'),
        createdAt: 'not-a-timestamp',
      },
    },
    {
      name: 'archive timestamp with invalid type',
      data: {
        ...validPortfolio('Invalid Archive Timestamp Type'),
        archivedAt: 'not-a-timestamp',
      },
    },
    {
      name: 'blank name',
      data: validPortfolio('   '),
    },
  ];

  for (const [index, { data, name }] of cases.entries()) {
    await assertFails(
      setDoc(
        doc(firestore, portfolioPath('user-a', `invalid-${index}`)),
        data,
      ),
      name,
    );
  }
});

test('owner can create, read, list, and only atomically bind an Asset registry', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const assetReference = doc(firestore, assetPath('user-a', 'asset-a'));
  const registryReference = doc(
    firestore,
    registryPath('user-a', 'BOVA11~B3~etf~BRL'),
  );

  await assertFails(setDoc(assetReference, validAsset()));
  await assertFails(setDoc(registryReference, { assetId: 'asset-a' }));

  await createAtomicAsset(firestore);
  const asset = await assertSucceeds(getDoc(assetReference));
  const registry = await assertSucceeds(getDoc(registryReference));
  assert.equal(asset.data()?.identityKey, 'BOVA11~B3~etf~BRL');
  assert.equal(registry.data()?.assetId, 'asset-a');

  const assets = await assertSucceeds(
    getDocs(collection(firestore, 'users/user-a/assets')),
  );
  const registries = await assertSucceeds(
    getDocs(collection(firestore, 'users/user-a/assetIdentities')),
  );
  assert.deepEqual(assets.docs.map(({ id }) => id), ['asset-a']);
  assert.deepEqual(registries.docs.map(({ id }) => id), ['BOVA11~B3~etf~BRL']);

  await assertFails(
    updateDoc(assetReference, { symbol: 'IVVB11' }),
  );
  await assertFails(deleteDoc(assetReference));
  await assertFails(
    updateDoc(registryReference, { assetId: 'asset-b' }),
  );
  await assertFails(deleteDoc(registryReference));
});

test('Asset schema, identity, registry ownership, and atomic pairing are closed', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const invalidCases = [
    ['extra field', { unexpected: true }],
    ['missing field', { currency: undefined }],
    ['lowercase symbol', { symbol: 'bova11' }],
    ['invalid market character', { market: 'B3/B3' }],
    ['invalid asset type', { assetType: 'future' }],
    ['invalid currency', { currency: 'ZZZ' }],
    ['divergent identity', { identityKey: 'OTHER~B3~etf~BRL' }],
    ['client timestamp', { createdAt: Timestamp.now() }],
  ];

  for (const [index, [name, overrides]] of invalidCases.entries()) {
    const data = validAsset(overrides);
    if (data.currency === undefined) {
      delete data.currency;
    }
    await assertFails(
      setDoc(doc(firestore, assetPath('user-a', `invalid-${index}`)), data),
      name,
    );
  }

  const orphanAsset = doc(firestore, assetPath('user-a', 'orphan-asset'));
  await assertFails(setDoc(orphanAsset, validAsset()));

  const orphanRegistry = doc(
    firestore,
    registryPath('user-a', 'BOVA11~B3~etf~BRL'),
  );
  await assertFails(setDoc(orphanRegistry, { assetId: 'missing-asset' }));

  const invalidRegistryCases = [
    ['registry extra field', { assetId: 'asset-a', unexpected: true }],
    ['registry missing assetId', { unexpected: true }],
    ['registry invalid assetId type', { assetId: 42 }],
  ];
  for (const [index, [name, data]] of invalidRegistryCases.entries()) {
    await assertFails(
      setDoc(
        doc(firestore, registryPath('user-a', `INVALID~B3~etf~BRL-${index}`)),
        data,
      ),
      name,
    );
  }

  const mismatchedBatch = writeBatch(firestore);
  mismatchedBatch.set(
    doc(firestore, assetPath('user-a', 'mismatch-asset')),
    validAsset({ identityKey: 'OTHER~B3~etf~BRL' }),
  );
  mismatchedBatch.set(
    doc(firestore, registryPath('user-a', 'BOVA11~B3~etf~BRL')),
    { assetId: 'mismatch-asset' },
  );
  await assertFails(mismatchedBatch.commit());

  const userB = testEnv.authenticatedContext('user-b').firestore();
  await assertFails(
    setDoc(
      doc(userB, registryPath('user-b', 'BOVA11~B3~etf~BRL')),
      { assetId: 'asset-a' },
    ),
  );
  await assertFails(
    getDoc(doc(userB, assetPath('user-a', 'asset-a'))),
  );
});

test('Asset and registry namespaces are owner-scoped and anonymous access fails', async () => {
  const userA = testEnv.authenticatedContext('user-a').firestore();
  const userB = testEnv.authenticatedContext('user-b').firestore();
  await createAtomicAsset(userA);

  await assertFails(getDoc(doc(userB, assetPath('user-a', 'asset-a'))));
  await assertFails(
    getDocs(collection(userB, 'users/user-a/assets')),
  );
  await assertFails(
    getDocs(query(collection(userB, 'users/user-a/assets'))),
  );
  await assertFails(
    setDoc(doc(userB, assetPath('user-a', 'injected')), validAsset()),
  );

  const anonymous = testEnv.unauthenticatedContext().firestore();
  await assertFails(
    getDocs(collection(anonymous, 'users/user-a/assets')),
  );
  await assertFails(
    getDoc(doc(anonymous, registryPath('user-a', 'BOVA11~B3~etf~BRL'))),
  );

  const ownAssets = await assertSucceeds(
    getDocs(collection(userA, 'users/user-a/assets')),
  );
  assert.equal(ownAssets.size, 1);
});

test('owner can create valid buy and sell Transactions, including schema limits', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  await createAtomicAsset(firestore);
  await createActivePortfolio(firestore);

  const buyReference = doc(
    firestore,
    transactionPath('user-a', 'portfolio-a', 'transaction-buy'),
  );
  await assertSucceeds(setDoc(buyReference, validTransaction()));

  const sellReference = doc(
    firestore,
    transactionPath('user-a', 'portfolio-a', 'transaction-sell'),
  );
  await assertSucceeds(
    setDoc(sellReference, validTransaction({ kind: 'sell', quantity: '999' })),
  );
  await assertSucceeds(
    setDoc(
      doc(firestore, transactionPath('user-a', 'portfolio-a', 'transaction-leap')),
      validTransaction({ effectiveDate: '2024-02-29' }),
    ),
  );

  const listed = await assertSucceeds(
    getDocs(collection(firestore, 'users/user-a/portfolios/portfolio-a/transactions')),
  );
  assert.equal(listed.size, 3);

  const invalidCases = [
    ['future kind', { kind: 'income' }],
    ['extra field', { extra: true }],
    ['zero quantity', { quantity: '0' }],
    ['leading zero', { quantity: '01' }],
    ['trailing zero', { quantity: '1.2300' }],
    ['exponent', { quantity: '1e2' }],
    ['too many integer digits', { quantity: '1234567890123456789012345678901' }],
    ['too many fractional digits', { quantity: '1.1234567890123456789' }],
    ['invalid unit price shape', { unitPrice: { currency: 'BRL', decimal: 10 } }],
    ['unit price extra field', {
      unitPrice: { currency: 'BRL', decimal: '10', extra: true },
    }],
    ['unit price missing decimal', { unitPrice: { currency: 'BRL' } }],
    ['zero unit price', { unitPrice: { currency: 'BRL', decimal: '0' } }],
    ['unit price leading zero', { unitPrice: { currency: 'BRL', decimal: '01' } }],
    ['invalid currency', { unitPrice: { currency: 'ZZZ', decimal: '10' } }],
    ['invalid date', { effectiveDate: '2026-02-30' }],
    ['non-leap February 29', { effectiveDate: '2023-02-29' }],
    ['zero year date', { effectiveDate: '0000-01-01' }],
    ['invalid createdAt', { createdAt: Timestamp.now() }],
  ];

  for (const [index, [name, overrides]] of invalidCases.entries()) {
    const data = validTransaction(overrides);
    if (name === 'extra field') {
      data.extra = true;
    }
    await assertFails(
      setDoc(
        doc(firestore, transactionPath('user-a', 'portfolio-a', `invalid-${index}`)),
        data,
      ),
      name,
    );
  }
});

test('Transactions require an owner Asset and an active owner Portfolio', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  await createActivePortfolio(firestore);
  const transactionReference = doc(
    firestore,
    transactionPath('user-a', 'portfolio-a', 'transaction-a'),
  );

  await assertFails(setDoc(transactionReference, validTransaction()));

  await createAtomicAsset(firestore);
  await assertSucceeds(setDoc(transactionReference, validTransaction()));
  await assertFails(
    updateDoc(transactionReference, { quantity: '2' }),
  );
  await assertFails(deleteDoc(transactionReference));

  const userB = testEnv.authenticatedContext('user-b').firestore();
  await assertFails(getDoc(doc(userB, transactionPath('user-a', 'portfolio-a', 'transaction-a'))));
  await assertFails(
    getDocs(collection(userB, 'users/user-a/portfolios/portfolio-a/transactions')),
  );
  await assertFails(
    setDoc(
      doc(userB, transactionPath('user-a', 'portfolio-a', 'transaction-injected')),
      validTransaction(),
    ),
  );

  const anonymous = testEnv.unauthenticatedContext().firestore();
  await assertFails(
    getDocs(collection(anonymous, 'users/user-a/portfolios/portfolio-a/transactions')),
  );
  await assertFails(
    setDoc(
      doc(anonymous, transactionPath('user-a', 'portfolio-a', 'transaction-anonymous')),
      validTransaction(),
    ),
  );

  await assertSucceeds(
    updateDoc(
      doc(firestore, portfolioPath('user-a', 'portfolio-a')),
      { archivedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    ),
  );
  const archivedTransaction = doc(
    firestore,
    transactionPath('user-a', 'portfolio-a', 'transaction-archived'),
  );
  await assertFails(setDoc(archivedTransaction, validTransaction()));
  await assertSucceeds(getDoc(transactionReference));
});

test('getAfter blocks archive plus Transaction in one commit', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  await createAtomicAsset(firestore);
  await createActivePortfolio(firestore);

  const batch = writeBatch(firestore);
  batch.set(
    doc(firestore, transactionPath('user-a', 'portfolio-a', 'race')),
    validTransaction(),
  );
  batch.update(
    doc(firestore, portfolioPath('user-a', 'portfolio-a')),
    { archivedAt: serverTimestamp(), updatedAt: serverTimestamp() },
  );
  await assertFails(batch.commit());
  await assertSucceeds(
    getDoc(doc(firestore, portfolioPath('user-a', 'portfolio-a'))),
  );
  const transactionAfterRejectedBatch = await assertSucceeds(
    getDoc(doc(firestore, transactionPath('user-a', 'portfolio-a', 'race'))),
  );
  assert.equal(transactionAfterRejectedBatch.exists(), false);
});

test('root, future, and unknown paths remain denied', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const deniedPaths = [
    'users/user-a',
    'users/user-a/goals/goal-a',
    'users/user-a/emergencyReserve/record-a',
    'users/user-a/portfolios/portfolio-a/allocationTargets/target-a',
    'users/user-a/portfolios/portfolio-a/snapshots/snapshot-a',
    'users/user-a/unknown/record-a',
    'users/user-a/assets/asset-a/future/record-a',
    'users/user-a/assetIdentities/BOVA11~B3~etf~BRL/future/record-a',
    'users/user-a/portfolios/portfolio-a/transactions/transaction-a/future/record-a',
  ];

  for (const [index, path] of deniedPaths.entries()) {
    const reference = doc(firestore, path);
    await assertFails(getDoc(reference), `read ${path}`);
    await assertFails(
      setDoc(reference, { fixture: `denied-${index}` }),
      `write ${path}`,
    );
  }
});
