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
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

const projectId = 'demo-reserva-clara';
const rulesPath = resolve(process.cwd(), 'firestore.rules');
const portfolioPath = (userId, portfolioId) =>
  `users/${userId}/portfolios/${portfolioId}`;

const validPortfolio = (name = 'Synthetic Portfolio') => ({
  name,
  baseCurrency: 'BRL',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

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

test('owner can create, read, list, update, and delete Portfolio', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const reference = doc(firestore, portfolioPath('user-a', 'portfolio-a'));

  await assertSucceeds(setDoc(reference, validPortfolio()));

  const created = await assertSucceeds(getDoc(reference));
  assert.equal(created.exists(), true);
  assert.equal(created.data()?.name, 'Synthetic Portfolio');
  assert.equal(created.data()?.baseCurrency, 'BRL');
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

  await assertSucceeds(deleteDoc(reference));
  const deleted = await assertSucceeds(getDoc(reference));
  assert.equal(deleted.exists(), false);
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

test('root, future, and unknown paths remain denied', async () => {
  const firestore = testEnv.authenticatedContext('user-a').firestore();
  const deniedPaths = [
    'users/user-a',
    'users/user-a/assets/asset-a',
    'users/user-a/goals/goal-a',
    'users/user-a/emergencyReserve/record-a',
    'users/user-a/portfolios/portfolio-a/transactions/transaction-a',
    'users/user-a/portfolios/portfolio-a/allocationTargets/target-a',
    'users/user-a/portfolios/portfolio-a/snapshots/snapshot-a',
    'users/user-a/unknown/record-a',
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
