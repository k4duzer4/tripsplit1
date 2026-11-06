import { t } from '@/lib/i18n';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/api/apiClient';

const PALETTE = ['#0ea5a4', '#f97316', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f43f5e', '#eab308', '#06b6d4', '#a855f7'];
const colorFor = (index) => PALETTE[index % PALETTE.length];

const TripContext = createContext(null);
export const useTripStore = () => useContext(TripContext);

export function TripProvider({ children }) {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setTrips(await api.request('/api/trips'));
    } catch (error) {
      if (error.status !== 401) console.error(t("Não foi possível carregar as viagens."), error);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTrip = useCallback(async ({ name, startDate, endDate, currency = 'BRL' }) => {
    const trip = await api.request('/api/trips', {
      method: 'POST',
      body: JSON.stringify({ name, startDate, endDate, currency }),
    });
    setTrips((current) => [...current, trip]);
    return trip.id;
  }, []);

  const deleteTrip = useCallback(async (id) => {
    await api.request(`/api/trips/${id}`, { method: 'DELETE' });
    setTrips((current) => current.filter((trip) => trip.id !== id));
  }, []);

  const updateTrip = useCallback(async (id, patch) => {
    const trip = await api.request(`/api/trips/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setTrips((current) => current.map((item) => (item.id === id ? trip : item)));
  }, []);

  const updateInvite = useCallback(async (id, patch) => {
    const invite = await api.request(`/api/trips/${id}/invite`, { method: 'PATCH', body: JSON.stringify(patch) });
    setTrips((current) => current.map((trip) => (trip.id === id ? { ...trip, ...invite } : trip)));
    return invite;
  }, []);

  const finishTrip = useCallback(async (id) => {
    const trip = await api.request(`/api/trips/${id}/finish`, { method: 'POST' });
    setTrips((current) => current.map((item) => item.id === id ? trip : item));
    return trip;
  }, []);

  const addParticipant = useCallback(async (tripId, participant) => {
    const created = await api.request(`/api/trips/${tripId}/participants`, { method: 'POST', body: JSON.stringify(participant) });
    setTrips((current) => current.map((trip) => trip.id === tripId ? { ...trip, participants: [...trip.participants, { ...created, color: colorFor(trip.participants.length) }] } : trip));
  }, []);

  const removeParticipant = useCallback(async (tripId, participantId) => {
    await api.request(`/api/trips/${tripId}/participants/${participantId}`, { method: 'DELETE' });
    setTrips((current) => current.map((trip) => trip.id === tripId ? {
      ...trip,
      participants: trip.participants.filter((participant) => participant.id !== participantId),
      expenses: trip.expenses.map((expense) => ({ ...expense, participantIds: expense.participantIds.filter((id) => id !== participantId) })),
    } : trip));
  }, []);

  const addExpense = useCallback(async (tripId, expense) => {
    const created = await api.request(`/api/trips/${tripId}/expenses`, { method: 'POST', body: JSON.stringify(expense) });
    setTrips((current) => current.map((trip) => trip.id === tripId ? { ...trip, paymentsPaid: {}, expenses: [created, ...trip.expenses] } : trip));
  }, []);

  const updateExpense = useCallback(async (tripId, expense) => {
    const updated = await api.request(`/api/trips/${tripId}/expenses/${expense.id}`, { method: 'PATCH', body: JSON.stringify(expense) });
    setTrips((current) => current.map((trip) => trip.id === tripId ? { ...trip, paymentsPaid: {}, expenses: trip.expenses.map((item) => item.id === expense.id ? updated : item) } : trip));
  }, []);

  const deleteExpense = useCallback(async (tripId, expenseId) => {
    await api.request(`/api/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' });
    setTrips((current) => current.map((trip) => trip.id === tripId ? { ...trip, paymentsPaid: {}, expenses: trip.expenses.filter((expense) => expense.id !== expenseId) } : trip));
  }, []);

  const togglePaymentPaid = useCallback(async (tripId, key) => {
    const trip = trips.find((item) => item.id === tripId);
    if (!trip) return;
    const paid = !Boolean(trip.paymentsPaid?.[key]);
    const paymentsPaid = await api.request(`/api/trips/${tripId}/payments`, { method: 'PATCH', body: JSON.stringify({ key, paid }) });
    setTrips((current) => current.map((item) => item.id === tripId ? { ...item, paymentsPaid } : item));
  }, [trips]);

  const joinTrip = useCallback(async (code) => {
    const trip = await api.request('/api/trips/join', { method: 'POST', body: JSON.stringify({ code }) });
    setTrips((current) => current.some((item) => item.id === trip.id) ? current.map((item) => item.id === trip.id ? trip : item) : [...current, trip]);
    return trip;
  }, []);

  const getTrip = useCallback((id) => trips.find((trip) => trip.id === id), [trips]);

  return (
    <TripContext.Provider value={{
      trips, isLoading, getTrip, refresh, createTrip, deleteTrip, updateTrip, updateInvite, finishTrip,
      addParticipant, removeParticipant, addExpense, updateExpense,
      deleteExpense, togglePaymentPaid, joinTrip,
    }}>
      {children}
    </TripContext.Provider>
  );
}
