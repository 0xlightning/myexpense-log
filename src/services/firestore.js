import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    serverTimestamp
} from 'firebase/firestore';

export const collections = {
    // Legacy (keep for potential migration)
    income: 'income',
    house: 'house',
    food: 'food',
    travel: 'travel',
    others: 'others',
    exchange: 'exchange',

    // New Canonical Collections
    income_sources: 'income_sources',
    income_records: 'income_records',
    expense_categories: 'expense_categories',
    expenditure_records: 'expenditure_records',
    cards: 'cards',
    on_credit: 'on_credit',
    transfers: 'transfers',
    transactions: 'transactions',
    investments: 'investments'
};

export const addItem = async (userId, collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, `users/${userId}/${collectionName}`), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};

export const updateItem = async (userId, collectionName, docId, data) => {
    try {
        const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating document: ", error);
        throw error;
    }
};

export const deleteItem = async (userId, collectionName, docId) => {
    try {
        const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting document: ", error);
        throw error;
    }
};

export const subscribeToCollection = (userId, collectionName, callback, onError) => {
    const q = query(
        collection(db, `users/${userId}/${collectionName}`)
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(items);
    }, (error) => {
        console.error(`Error subscribing to ${collectionName}:`, error);
        if (onError) onError(error);
    });
};
