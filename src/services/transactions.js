import { db } from './firebase';
import { runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';
import { collections } from './firestore';

/**
 * Adds an income record and updates the corresponding card balance atomically.
 * also creates a ledger entry.
 */
export const addIncomeTransaction = async (userId, { amount, date, cardId, sourceId, notes }) => {
    try {
        await runTransaction(db, async (transaction) => {
            // 1. References
            const cardRef = doc(db, `users/${userId}/${collections.cards}`, cardId);
            const incomeRef = doc(collection(db, `users/${userId}/${collections.income_records}`));
            const ledgerRef = doc(collection(db, `users/${userId}/${collections.transactions}`));

            // 2. Reads
            const cardDoc = await transaction.get(cardRef);
            if (!cardDoc.exists()) throw new Error("Card does not exist!");

            const currentBalance = cardDoc.data().balance || 0;
            const newBalance = currentBalance + amount;

            // 3. Writes
            // A. Update Card Balance
            transaction.update(cardRef, { balance: newBalance });

            // B. Create Income Record
            transaction.set(incomeRef, {
                amount,
                date,
                cardId,
                sourceId,
                notes: notes || '',
                createdAt: serverTimestamp()
            });

            // C. Create Ledger Entry
            transaction.set(ledgerRef, {
                type: 'income',
                amount,
                date,
                cardId,
                categoryId: sourceId, // Using sourceId as category for income
                refId: incomeRef.id,
                description: `Income from ${sourceId}`,
                createdAt: serverTimestamp()
            });
        });
        console.log("Income transaction completed successfully.");
    } catch (e) {
        console.error("Income transaction failed: ", e);
        throw e;
    }
};

/**
 * Adds an expense record and updates the corresponding card balance atomically.
 * also creates a ledger entry.
 */
export const addExpenseTransaction = async (userId, { amount, date, cardId, categoryId, notes }) => {
    try {
        await runTransaction(db, async (transaction) => {
            // 1. References
            const cardRef = doc(db, `users/${userId}/${collections.cards}`, cardId);
            const expenseRef = doc(collection(db, `users/${userId}/${collections.expenditure_records}`));
            const ledgerRef = doc(collection(db, `users/${userId}/${collections.transactions}`));

            // 2. Reads
            const cardDoc = await transaction.get(cardRef);
            if (!cardDoc.exists()) throw new Error("Card does not exist!");

            const cardData = cardDoc.data();

            // Logic: If credit card, we increase 'usedCredit' (start negative or positive? usually tracked separately)
            // For simplicity in this v1 refactor:
            // Debit/Cash: Balance DECREASES.
            // Credit: Balance DECREASES (becomes more negative) OR if you track "Debt", it INCREASES.
            // Let's assume 'balance' represents net worth. So expense always decreases balance.
            // If it's a credit card with 0 balance, it goes to -100.

            const currentBalance = cardData.balance || 0;
            const newBalance = currentBalance - amount;

            // Check for insufficient funds only if NOT a credit card (optional, but good practice)
            if (cardData.type !== 'credit' && newBalance < 0) {
                // console.warn("Warning: Negative balance on debit account");
                // uncomment to block: throw new Error("Insufficient funds");
            }

            // 3. Writes
            transaction.update(cardRef, { balance: newBalance });

            transaction.set(expenseRef, {
                amount,
                date,
                cardId,
                categoryId,
                notes: notes || '',
                createdAt: serverTimestamp()
            });

            transaction.set(ledgerRef, {
                type: 'expense',
                amount, // You might want to store as negative in ledger, or keep absolute and use 'type'
                date,
                cardId,
                categoryId,
                refId: expenseRef.id,
                description: `Expense for ${categoryId}`,
                createdAt: serverTimestamp()
            });
        });
        console.log("Expense transaction completed successfully.");
    } catch (e) {
        console.error("Expense transaction failed: ", e);
        throw e;
    }
};

/**
 * Transfers funds between two cards.
 */
export const performTransfer = async (userId, { fromCardId, toCardId, amount, date, notes }) => {
    try {
        await runTransaction(db, async (transaction) => {
            const fromRef = doc(db, `users/${userId}/${collections.cards}`, fromCardId);
            const toRef = doc(db, `users/${userId}/${collections.cards}`, toCardId);
            const transferRef = doc(collection(db, `users/${userId}/${collections.transfers}`));
            const ledgerOutRef = doc(collection(db, `users/${userId}/${collections.transactions}`));
            const ledgerInRef = doc(collection(db, `users/${userId}/${collections.transactions}`));

            const fromDoc = await transaction.get(fromRef);
            const toDoc = await transaction.get(toRef);

            if (!fromDoc.exists() || !toDoc.exists()) throw new Error("One or more cards do not exist!");

            const fromBalance = fromDoc.data().balance || 0;
            const toBalance = toDoc.data().balance || 0;

            const newFromBalance = fromBalance - amount;
            const newToBalance = toBalance + amount;

            // Validation
            if (fromDoc.data().type !== 'credit' && newFromBalance < 0) {
                throw new Error(`Insufficient funds in ${fromDoc.data().name}`);
            }

            // Updates
            transaction.update(fromRef, { balance: newFromBalance });
            transaction.update(toRef, { balance: newToBalance });

            // Record Transfer
            transaction.set(transferRef, {
                amount,
                date,
                fromCardId,
                toCardId,
                notes: notes || '',
                createdAt: serverTimestamp()
            });

            // Ledger Out
            transaction.set(ledgerOutRef, {
                type: 'transfer_out',
                amount: amount,
                date,
                cardId: fromCardId,
                refId: transferRef.id,
                description: `Transfer to ${toDoc.data().name}`,
                createdAt: serverTimestamp()
            });

            // Ledger In
            transaction.set(ledgerInRef, {
                type: 'transfer_in',
                amount: amount,
                date,
                cardId: toCardId,
                refId: transferRef.id,
                description: `Transfer from ${fromDoc.data().name}`,
                createdAt: serverTimestamp()
            });
        });
    } catch (e) {
        console.error("Transfer transaction failed: ", e);
        throw e;
    }
};

/**
 * Adds a credit/debt record.
 * Logic:
 * - If "On Credit" (creating debt): Increase 'usedCredit' or Decrease 'balance' (depending on card type and model).
 *   For a Credit Card, typically "Balance" is negative or we track "Used".
 *   Let's stick to the "Balance is Net Worth" model.
 *   So spending on credit card -> Balance goes DOWN (e.g. 0 -> -50).
 *   Paying off credit card -> Balance goes UP (e.g. -50 -> 0).
 */
export const addCreditTransaction = async (userId, { amount, date, cardId, paymentType, notes }) => {
    try {
        await runTransaction(db, async (transaction) => {
            const cardRef = doc(db, `users/${userId}/${collections.cards}`, cardId);
            const creditRef = doc(collection(db, `users/${userId}/${collections.on_credit}`));
            const ledgerRef = doc(collection(db, `users/${userId}/${collections.transactions}`));

            const cardDoc = await transaction.get(cardRef);
            if (!cardDoc.exists()) throw new Error("Card does not exist!");

            // Allow negative balance for credit cards, but maybe check credit limit?
            const currentBalance = cardDoc.data().balance || 0;
            const newBalance = currentBalance - amount;

            if (cardDoc.data().type === 'credit' && cardDoc.data().creditLimit) {
                if (Math.abs(newBalance) > cardDoc.data().creditLimit) {
                    throw new Error("Credit Limit Exceeded!");
                }
            }

            transaction.update(cardRef, { balance: newBalance });

            transaction.set(creditRef, {
                amount,
                date,
                cardId,
                paymentType: 'credit',
                status: 'open', // Open debt
                notes: notes || '',
                createdAt: serverTimestamp()
            });

            transaction.set(ledgerRef, {
                type: 'credit_usage',
                amount,
                date,
                cardId,
                refId: creditRef.id,
                description: `Credit usage on ${cardDoc.data().name}`,
                createdAt: serverTimestamp()
            });
        });
    } catch (e) {
        console.error("Credit transaction failed: ", e);
        throw e;
    }
};

/**
 * Creates a new card and optionally records an initial balance adjustment.
 */
export const createCard = async (userId, { name, type, initialBalance, creditLimit, currency }) => {
    try {
        await runTransaction(db, async (transaction) => {
            const cardRef = doc(collection(db, `users/${userId}/${collections.cards}`));
            const ledgerRef = doc(collection(db, `users/${userId}/${collections.transactions}`));

            const balance = parseFloat(initialBalance) || 0;

            // 1. Create Card
            transaction.set(cardRef, {
                name,
                type,
                balance: balance, // Sets starting balance
                creditLimit: parseFloat(creditLimit) || 0,
                currency: currency || 'USD',
                isActive: true, // Soft delete flag
                createdAt: serverTimestamp()
            });

            // 2. If there is an initial balance, record it as an adjustment
            // (Only if balance is not 0, to avoid clutter)
            if (balance !== 0) {
                transaction.set(ledgerRef, {
                    type: 'adjustment',
                    amount: balance,
                    date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
                    cardId: cardRef.id,
                    refId: cardRef.id, // Reference the card itself
                    description: `Initial balance for ${name}`,
                    createdAt: serverTimestamp()
                });
            }
        });
    } catch (e) {
        console.error("Create card failed: ", e);
        throw e;
    }
};

/**
 * Adds an investment record and updates the corresponding card balance atomically.
 */
export const addInvestmentTransaction = async (userId, { amount, date, cardId, category, notes }) => {
    try {
        await runTransaction(db, async (transaction) => {
            const cardRef = doc(db, `users/${userId}/${collections.cards}`, cardId);
            const investRef = doc(collection(db, `users/${userId}/${collections.investments}`));
            const ledgerRef = doc(collection(db, `users/${userId}/${collections.transactions}`));

            const cardDoc = await transaction.get(cardRef);
            if (!cardDoc.exists()) throw new Error("Card does not exist!");

            const currentBalance = cardDoc.data().balance || 0;
            const newBalance = currentBalance - amount;

            // Update Card Balance
            transaction.update(cardRef, { balance: newBalance });

            // Create Investment Record
            transaction.set(investRef, {
                amount,
                date,
                cardId,
                category: category || 'General',
                notes: notes || '',
                createdAt: serverTimestamp()
            });

            // Create Ledger Entry
            transaction.set(ledgerRef, {
                type: 'investment',
                amount,
                date,
                cardId,
                category: category,
                refId: investRef.id,
                description: `Investment in ${category}`,
                createdAt: serverTimestamp()
            });
        });
        console.log("Investment transaction completed successfully.");
    } catch (e) {
        console.error("Investment transaction failed: ", e);
        throw e;
    }
};

/**
 * Reverses a transaction (Income/Expense/Investment) and deletes the record.
 * @param {string} type 'income' | 'expense' | 'investment'
 */
export const deleteTransaction = async (userId, collectionName, itemId, cardId, amount, type) => {
    try {
        await runTransaction(db, async (transaction) => {
            const itemRef = doc(db, `users/${userId}/${collectionName}`, itemId);
            const cardRef = doc(db, `users/${userId}/${collections.cards}`, cardId);

            const cardDoc = await transaction.get(cardRef);
            if (!cardDoc.exists()) throw new Error("Card not found");

            const currentBalance = cardDoc.data().balance || 0;
            let newBalance = currentBalance;

            // Reverse logic
            if (type === 'income') {
                newBalance = currentBalance - amount;
            } else if (type === 'expense' || type === 'investment') {
                // Both expense and investment subtract from balance, so we add back
                newBalance = currentBalance + amount;
            }

            transaction.update(cardRef, { balance: newBalance });
            transaction.delete(itemRef);

            const ledgerRef = doc(collection(db, `users/${userId}/${collections.transactions}`));
            transaction.set(ledgerRef, {
                type: 'reversal',
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                cardId: cardId,
                refId: itemId,
                description: `Reversal of ${type} ${itemId}`,
                createdAt: serverTimestamp()
            });
        });
    } catch (e) {
        console.error("Delete transaction failed:", e);
        throw e;
    }
};
