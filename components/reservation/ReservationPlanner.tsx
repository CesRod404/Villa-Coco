"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Users } from "lucide-react";
import type { ReservationPeriod } from "@/types/wordpress";
import { HUBSPOT_REFERRAL_OPTIONS } from "@/lib/hubspot/villa-form";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const monthFormatter = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });
const shortFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

function toIso(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseIso(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function addDays(value: string, days: number) {
    const date = parseIso(value);
    date.setDate(date.getDate() + days);
    return toIso(date);
}

function rangeContains(start: string, end: string, date: string) {
    return date >= start && date < end;
}

function isBetween(value: string, start?: string, end?: string) {
    return Boolean(start && end && value >= start && value <= end);
}

export default function ReservationPlanner({ villaId, villaName, reservations, availabilityOnline, maxGuests = 20 }: { villaId: number; villaName: string; reservations: ReservationPeriod[]; availabilityOnline: boolean; maxGuests?: number }) {
    const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [checkIn, setCheckIn] = useState<string>();
    const [checkOut, setCheckOut] = useState<string>();
    const [guests, setGuests] = useState(2);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string>();
    const [syncWarning, setSyncWarning] = useState<string>();
    const [submitting, setSubmitting] = useState(false);
    const [dateError, setDateError] = useState<string>();
    const [flexibleDates, setFlexibleDates] = useState(false);

    const calendarDays = useMemo(() => {
        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        return Array.from({ length: first.getDay() + daysInMonth }, (_, index) => index < first.getDay() ? null : new Date(month.getFullYear(), month.getMonth(), index - first.getDay() + 1));
    }, [month]);

    const isBooked = (iso: string) => reservations.some((reservation) => rangeContains(reservation.check_in, reservation.check_out, iso));
    const isPast = (iso: string) => iso < toIso(new Date());

    function selectDate(iso: string) {
        if (isBooked(iso) || isPast(iso) || !availabilityOnline) return;
        setDateError(undefined);
        if (checkIn === iso && !checkOut) {
            setCheckIn(undefined);
            return;
        }
        if (!checkIn || checkOut || iso < checkIn) {
            setCheckIn(iso);
            setCheckOut(undefined);
            setSubmitted(false);
            return;
        }
        if (iso === checkIn) {
            setDateError("Elige una fecha de salida posterior a tu llegada.");
            return;
        }
        const hasConflict = reservations.some((reservation) => reservation.check_in < iso && reservation.check_out > checkIn);
        if (hasConflict) {
            setDateError("Ese rango incluye fechas reservadas. Elige otra salida.");
            return;
        }
        setCheckOut(iso);
        setSubmitted(false);
    }

    const nights = checkIn && checkOut ? Math.round((parseIso(checkOut).getTime() - parseIso(checkIn).getTime()) / 86400000) : 0;

    return (
        <section id="reservar" className="overflow-hidden rounded-4xl border border-[#d8e0dd] bg-white shadow-[0_24px_70px_rgba(23,48,79,0.10)] lg:rounded-[2.25rem]">
            <header className="relative overflow-hidden bg-[#17304f] px-6 py-7 text-white sm:px-8">
                <div aria-hidden="true" className="absolute -right-12 bottom-0 h-24 w-72 rotate-[-8deg] rounded-[100%] border-t border-[#77bbb9]/70" />
                <div aria-hidden="true" className="absolute -right-4 bottom-[-1.4rem] h-24 w-72 rotate-[-8deg] rounded-[100%] border-t border-[#77bbb9]/35" />
                <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-[#b6d8cf]">Carta de marea · planifica tu estancia</p>
                <h2 className="relative mt-2 font-serif text-3xl">Disponibilidad de {villaName}</h2>
                <p className="relative mt-2 text-sm text-slate-200">Elige llegada y salida. Los días azul marino ya están reservados.</p>
            </header>

            <div className="p-5 sm:p-8">
                {!availabilityOnline && <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-800">No se puede verificar la disponibilidad en este momento. Intenta recargar antes de enviar una solicitud.</div>}
                <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-[#e7f4ee]" />Disponible</span>
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-[#17304f]" />Reservado</span>
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-[#d5e6ff]" />Tu selección</span>
                </div>

                <div className="rounded-2xl border border-[#c9dcde] bg-[#fbfefe] p-3 sm:p-5">
                    <div className="mb-5 flex items-center justify-between">
                        <button aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-2 text-[#17304f] transition hover:bg-[#e7f4ee]"><ChevronLeft size={21} /></button>
                        <h3 className="font-serif text-xl capitalize text-[#17304f]">{monthFormatter.format(month)}</h3>
                        <button aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full p-2 text-[#17304f] transition hover:bg-[#e7f4ee]"><ChevronRight size={21} /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                        {DAYS.map((day) => <span key={day} className="pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{day}</span>)}
                        {calendarDays.map((date, index) => {
                            if (!date) return <span key={`blank-${index}`} />;
                            const iso = toIso(date);
                            const booked = isBooked(iso);
                            const disabled = booked || isPast(iso);
                            const selectedStart = iso === checkIn;
                            const selectedEnd = checkOut ? iso === addDays(checkOut, -1) : false;
                            const selected = selectedStart || selectedEnd;
                            const inSelection = isBetween(iso, checkIn, checkOut ? addDays(checkOut, -1) : undefined);
                            return <button key={iso} disabled={disabled || !availabilityOnline} onClick={() => selectDate(iso)} className={`aspect-square min-h-10 rounded-lg text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dd9b4f] ${booked ? "bg-[#17304f] text-white" : selected ? "bg-[#dd9b4f] text-[#17304f] ring-2 ring-[#17304f] ring-offset-1" : inSelection ? "bg-[#cbe6eb] text-[#17304f]" : disabled ? "cursor-not-allowed text-slate-300 line-through" : "bg-[#e1f2ee] text-[#327154] hover:-translate-y-0.5 hover:bg-[#c4e4dc]"}`}>{date.getDate()}</button>;
                        })}
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#f4f7f6] p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Llegada</p><p className="mt-1 font-semibold text-[#17304f]">{checkIn ? shortFormatter.format(parseIso(checkIn)) : "Selecciona un día"}</p></div>
                    <div className="rounded-xl bg-[#f4f7f6] p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Salida</p><p className="mt-1 font-semibold text-[#17304f]">{checkOut ? shortFormatter.format(parseIso(checkOut)) : "Selecciona el último día"}</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Puedes elegir cualquier cantidad de noches disponibles. La salida no se considera noche ocupada.</p>
                {dateError && <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{dateError}</p>}

                <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f4f7f6] p-4 text-sm text-[#17304f]">
                    <button type="button" role="switch" aria-checked={flexibleDates} aria-label="Mis fechas son flexibles" onClick={() => setFlexibleDates((value) => !value)} className={`relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dd9b4f] ${flexibleDates ? "bg-[#2f6faa]" : "bg-[#dfe3eb]"}`}><span className="absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow-[0_1px_4px_rgba(23,48,79,.22)] transition-transform duration-200" style={{ transform: `translateX(${flexibleDates ? 20 : 4}px)` }} /></button>
                    <span><strong className="block">Mis fechas son flexibles</strong><span className="text-xs text-slate-500">Puedo ajustar mi estancia si hay una mejor opción.</span></span>
                </div>

                <div className="mt-7 flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div><p className="flex items-center gap-2 font-semibold text-[#17304f]"><Users size={18} />Número de invitados</p><p className="mt-1 text-xs text-slate-500">Máximo {maxGuests} huéspedes</p></div>
                    <div className="flex items-center gap-3"><button aria-label="Reducir invitados" disabled={guests <= 1} onClick={() => setGuests((value) => value - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"><Minus size={16} /></button><span className="w-5 text-center font-bold">{guests}</span><button aria-label="Aumentar invitados" disabled={guests >= maxGuests} onClick={() => setGuests((value) => value + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"><Plus size={16} /></button></div>
                </div>

                <form onSubmit={async (event) => {
                    event.preventDefault();
                    if (!checkIn || !checkOut || submitted || submitting) return;
                    const form = new FormData(event.currentTarget);
                    setSubmitting(true);
                    setSubmitError(undefined);
                    setSyncWarning(undefined);
                    const response = await fetch("/api/reservations/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ villaId, villaName, checkIn, checkOut, guests, flexibleDates, firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), phone: `${form.get("phoneCountryCode")} ${form.get("phone")}`, referralSource: form.get("referralSource"), travelPlans: form.get("travelPlans") }) });
                    setSubmitting(false);
                    const result = await response.json().catch(() => null);
                    if (response.ok) {
                        setSubmitted(true);
                        if (!result?.hubspotSynced) setSyncWarning("La solicitud quedó guardada, pero HubSpot no confirmó la sincronización. El equipo debe revisarla; no es necesario volver a enviarla.");
                    } else setSubmitError(result?.error || "No pudimos enviar tu solicitud. Inténtalo de nuevo.");
                }} className="mt-7 space-y-4">
                    <div className="border-b border-[#d8e0dd] pb-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d806f]">Tus datos</p>
                        <h3 className="mt-1 font-serif text-2xl text-[#17304f]">Cuéntanos cómo contactarte</h3>
                        <p className="mt-1 text-sm text-slate-500">Usaremos esta información únicamente para dar seguimiento a tu estancia.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold text-[#17304f]">Nombre(s)<input required autoComplete="given-name" name="firstName" className="mt-1.5 w-full rounded-xl border border-[#c9dcde] bg-[#fbfefe] px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#4d806f] focus:bg-white focus:ring-2 focus:ring-[#d5e6ff]" placeholder="María" /></label>
                        <label className="text-sm font-semibold text-[#17304f]">Apellidos<input required autoComplete="family-name" name="lastName" className="mt-1.5 w-full rounded-xl border border-[#c9dcde] bg-[#fbfefe] px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#4d806f] focus:bg-white focus:ring-2 focus:ring-[#d5e6ff]" placeholder="González" /></label>
                        <label className="text-sm font-semibold text-[#17304f] sm:col-span-2">Correo electrónico<input required autoComplete="email" type="email" name="email" className="mt-1.5 w-full rounded-xl border border-[#c9dcde] bg-[#fbfefe] px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#4d806f] focus:bg-white focus:ring-2 focus:ring-[#d5e6ff]" placeholder="maria@ejemplo.com" /></label>
                        <label className="text-sm font-semibold text-[#17304f] sm:col-span-2">WhatsApp o teléfono<div className="mt-1.5 flex overflow-hidden rounded-xl border border-[#c9dcde] bg-[#fbfefe] focus-within:border-[#4d806f] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d5e6ff]"><select name="phoneCountryCode" aria-label="Código de país" defaultValue="+52" className="w-32 border-r border-[#c9dcde] bg-[#e7f4ee] px-3 py-3 text-sm font-semibold text-[#17304f] outline-none"><option value="+52">🇲🇽 +52</option><option value="+1">🇺🇸 +1</option><option value="+1">🇨🇦 +1</option><option value="+34">🇪🇸 +34</option><option value="+44">🇬🇧 +44</option><option value="+33">🇫🇷 +33</option><option value="+49">🇩🇪 +49</option><option value="+57">🇨🇴 +57</option><option value="+54">🇦🇷 +54</option></select><input required autoComplete="tel" inputMode="tel" type="tel" name="phone" className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none" placeholder="55 1234 5678" /></div></label>
                        <label className="text-sm font-semibold text-[#17304f] sm:col-span-2">¿Cómo nos conociste?<select required name="referralSource" defaultValue="" className="mt-1.5 w-full rounded-xl border border-[#c9dcde] bg-[#fbfefe] px-4 py-3 outline-none transition focus:border-[#4d806f] focus:bg-white focus:ring-2 focus:ring-[#d5e6ff]"><option value="" disabled>Selecciona una opción</option>{HUBSPOT_REFERRAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><span className="mt-1.5 block text-xs font-normal text-slate-500">Las opciones están sincronizadas con HubSpot.</span></label>
                        <label className="text-sm font-semibold text-[#17304f] sm:col-span-2">Cuéntanos sobre tu viaje<textarea required name="travelPlans" rows={4} className="mt-1.5 w-full resize-y rounded-xl border border-[#c9dcde] bg-[#fbfefe] px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#4d806f] focus:bg-white focus:ring-2 focus:ring-[#d5e6ff]" placeholder="Motivo del viaje, celebraciones, preferencias o cualquier detalle importante." /></label>
                    </div>
                    <button type="submit" disabled={!checkIn || !checkOut || submitting || submitted || !availabilityOnline} className="w-full rounded-xl bg-[#17304f] px-5 py-4 font-bold text-white transition hover:bg-[#264c76] disabled:cursor-not-allowed disabled:opacity-40">{submitted ? "Solicitud enviada" : submitting ? "Enviando solicitud…" : `Solicitar estas fechas${nights ? ` · ${nights} noche${nights === 1 ? "" : "s"}` : ""}`}</button>
                    {submitted && <p role="status" className="rounded-xl bg-[#e7f4ee] p-4 text-sm text-[#276044]">Recibimos tu solicitud. El equipo confirmará la disponibilidad y la reserva solo bloqueará fechas cuando sea aprobada.</p>}
                    {syncWarning && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{syncWarning}</p>}
                    {submitError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
                </form>
            </div>
        </section>
    );
}