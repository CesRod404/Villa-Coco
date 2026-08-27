"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { ReservationPeriod } from "@/types/wordpress";
import type { ResponsiveVillaImage } from "@/lib/images/villa-images";
import { HUBSPOT_REFERRAL_OPTIONS } from "@/lib/hubspot/villa-form";
import styles from "./ReservationPlanner.module.css";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function ResilientPhoto({ image, alt, className = "", gallery = false }: { image?: ResponsiveVillaImage; alt: string; className?: string; gallery?: boolean }) {
    const preferredSrc = gallery ? image?.src : image?.cardSrc || image?.src;
    const [resolvedSrc, setResolvedSrc] = useState(image?.fallbackSrc || preferredSrc);

    useEffect(() => {
        const primarySrc = gallery ? image?.src : image?.cardSrc || image?.src;
        setResolvedSrc(image?.fallbackSrc || primarySrc);
        if (!primarySrc || !image?.fallbackSrc || primarySrc === image.fallbackSrc) return;
        const candidate = new window.Image();
        candidate.onload = () => setResolvedSrc(primarySrc);
        candidate.src = primarySrc;
        return () => { candidate.onload = null; };
    }, [gallery, image]);

    if (!resolvedSrc || !image) return null;
    const primarySrc = gallery ? image.src : image.cardSrc || image.src;
    return (
        <img
            src={resolvedSrc}
            srcSet={resolvedSrc === primarySrc ? image.srcSet : undefined}
            sizes={gallery ? "(max-width: 1023px) 136px, 604px" : "(max-width: 1023px) 136px, 456px"}
            width={gallery ? image.width : image.cardWidth || image.width}
            height={gallery ? image.height : image.cardHeight || image.height}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
        />
    );
}

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

function shortVillaName(name: string) {
    return name.replace(/^(casa|villa)\s+/i, "").trim();
}

function shiftMonth(date: Date, delta: number) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildCalendarDays(monthDate: Date) {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    return Array.from({ length: first.getDay() + daysInMonth }, (_, index) =>
        index < first.getDay() ? null : new Date(monthDate.getFullYear(), monthDate.getMonth(), index - first.getDay() + 1)
    );
}

function rangeContains(start: string, end: string, date: string) {
    return date >= start && date < end;
}

function isBetween(value: string, start?: string, end?: string) {
    return Boolean(start && end && value >= start && value <= end);
}

type ReservationPlannerProps = {
    villas: Array<{
        id: number;
        name: string;
        image?: ResponsiveVillaImage;
        guests?: number;
        bedrooms?: number;
        bathrooms?: number;
    }>;
    reservations: ReservationPeriod[];
    availabilityOnline: boolean;
    maxGuests?: number;
    heroImage?: ResponsiveVillaImage;
    heroImageAlt?: string;
    description?: string;
    price?: number;
    amenities?: string[];
    bedrooms?: number;
    bathrooms?: number;
};

export default function ReservationPlanner({
    villas,
    reservations,
    availabilityOnline,
    maxGuests = 20,
    heroImage,
    heroImageAlt,
    description,
    price,
    amenities = [],
    bedrooms,
    bathrooms,
}: ReservationPlannerProps) {
    const router = useRouter();
    const villaIds = villas.map((villa) => villa.id);
    const villaName = villas.map((villa) => villa.name).join(" + ");
    const pairedStay = villas.length > 1;
    const displayVillaName = villas.map((villa) => shortVillaName(villa.name)).join(" + ");
    const contextLabel = pairedStay
        ? `Mix& Match - ${displayVillaName}`
        : `Villa - ${displayVillaName}`;
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

    // --- Form fields (controlled so we can validate in real time) ---
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneCountryCode, setPhoneCountryCode] = useState("+52");
    const [phone, setPhone] = useState("");
    const [referralSource, setReferralSource] = useState("");
    const [travelPlans, setTravelPlans] = useState("");
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    function markTouched(field: string) {
        setTouched((value) => ({ ...value, [field]: true }));
    }

    const errors = {
        firstName: firstName.trim().length === 0
            ? "Enter your first name."
            : !NAME_REGEX.test(firstName)
                ? "Letters and spaces only, no numbers or symbols."
                : undefined,
        lastName: lastName.trim().length === 0
            ? "Enter your last name."
            : !NAME_REGEX.test(lastName)
                ? "Letters and spaces only, no numbers or symbols."
                : undefined,
        email: email.trim().length === 0
            ? "Enter your email address."
            : !EMAIL_REGEX.test(email)
                ? "Enter a valid email, e.g. maria@example.com."
                : undefined,
        phone: phone.length === 0
            ? "Enter your phone number."
            : phone.length < 7 || phone.length > 15
                ? "Enter 7 to 15 digits, no letters or spaces."
                : undefined,
        referralSource: referralSource.length === 0 ? "Please select an option." : undefined,
        travelPlans: travelPlans.trim().length === 0 ? "Tell us briefly about your trip." : undefined,
    };

    const hasFormErrors = Object.values(errors).some(Boolean);

    function handlePhoneKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
        if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;
        if (!/^[0-9]$/.test(event.key)) event.preventDefault();
    }

    function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
        setPhone(event.target.value.replace(/\D/g, "").slice(0, 15));
    }

    function handlePhonePaste(event: React.ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const digitsOnly = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 15);
        setPhone((current) => (current + digitsOnly).slice(0, 15));
    }

    function handleNameChange(setter: (value: string) => void) {
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            setter(event.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, ""));
        };
    }

    function updateGuests(value: number) {
        if (!Number.isFinite(value)) return;
        setGuests(Math.min(maxGuests, Math.max(1, Math.trunc(value))));
    }

    function handleGuestsKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (["e", "E", "+", "-", ".", ","].includes(event.key)) event.preventDefault();
    }

    const primaryCalendarDays = useMemo(() => buildCalendarDays(month), [month]);
    const secondaryMonth = useMemo(() => shiftMonth(month, 1), [month]);
    const secondaryCalendarDays = useMemo(() => buildCalendarDays(secondaryMonth), [secondaryMonth]);

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
            setDateError("Choose a departure date after your arrival.");
            return;
        }
        const hasConflict = reservations.some((reservation) => reservation.check_in < iso && reservation.check_out > checkIn);
        if (hasConflict) {
            setDateError("That range includes booked dates. Choose another departure.");
            return;
        }
        setCheckOut(iso);
        setSubmitted(false);
    }

    const nights = checkIn && checkOut ? Math.round((parseIso(checkOut).getTime() - parseIso(checkIn).getTime()) / 86400000) : 0;

    const fieldClass = (field: keyof typeof errors) =>
        `mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[#1a2e4a]/50 focus:ring-2 ${touched[field] && errors[field]
            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
            : "border-[#e2e8f0] focus:border-[#1a2e4a] focus:ring-[#dce7f4]"
        }`;

    function renderMonthPanel(monthDate: Date, days: Array<Date | null>, options: { showPrev: boolean; showNext: boolean }) {
        return (
            <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
                <div className="flex items-center justify-between bg-[#1a2e4a] px-4 py-3 sm:px-5">
                    {options.showPrev ? (
                        <button aria-label="Previous month" onClick={() => setMonth((current) => shiftMonth(current, -1))} className="rounded-full p-2 text-white transition hover:bg-white/10"><ChevronLeft size={20} /></button>
                    ) : <span className="w-9" aria-hidden="true" />}
                    <h3 className="text-sm leading-5 font-bold tracking-[0.35px] text-white">{monthFormatter.format(monthDate)}</h3>
                    {options.showNext ? (
                        <button aria-label="Next month" onClick={() => setMonth((current) => shiftMonth(current, 1))} className="rounded-full p-2 text-white transition hover:bg-white/10"><ChevronRight size={20} /></button>
                    ) : <span className="w-9" aria-hidden="true" />}
                </div>

                <div className={styles.calendarLegend} aria-label="Calendar status legend">
                    <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.availableSwatch}`}>8</span>Available</span>
                    <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.bookedSwatch}`}>8</span>Booked</span>
                    <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.selectedSwatch}`}>8</span>Selected</span>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-7 gap-px text-center">
                        {DAYS.map((day) => <span key={day} className="pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{day}</span>)}
                        {days.map((date, index) => {
                            if (!date) return <span key={`blank-${index}`} />;
                            const iso = toIso(date);
                            const booked = isBooked(iso);
                            const disabled = booked || isPast(iso);
                            const selectedStart = iso === checkIn;
                            const selectedEnd = checkOut ? iso === addDays(checkOut, -1) : false;
                            const selected = selectedStart || selectedEnd;
                            const inSelection = isBetween(iso, checkIn, checkOut ? addDays(checkOut, -1) : undefined);
                            return <button key={iso} disabled={disabled || !availabilityOnline} onClick={() => selectDate(iso)} className={`h-8 w-full rounded-lg border text-sm font-bold outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c4a7c] ${booked ? "border-[#c9a24c] bg-[#c9a24c] text-white" : selected ? "border-[#2c4a7c] bg-[#2c4a7c] text-white" : inSelection ? "border-[#dce7f4] bg-[#dce7f4] text-[#1a2e4a]" : disabled ? "cursor-not-allowed border-transparent text-slate-300 line-through" : "border-[#d5e7ec] bg-[#eaf3ec] text-[#2f6b4c] hover:bg-[#d7ebdd]"}`}>{date.getDate()}</button>;
                        })}
                    </div>
                </div>
            </div>
        );
    }

    const statsRow = (villa: { guests?: number; bedrooms?: number; bathrooms?: number } = { guests: maxGuests, bedrooms, bathrooms }) => (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-[#6a7282]">
            <span className="inline-flex items-center gap-1.5"><Image src="/images/icons/villa-guests.svg" alt="" width={16} height={16} />{villa.guests || maxGuests} guests</span>
            {Boolean(villa.bedrooms) && <span className="inline-flex items-center gap-1.5"><Image src="/images/icons/villa-bedrooms.svg" alt="" width={16} height={16} />{villa.bedrooms} bedrooms</span>}
            {Boolean(villa.bathrooms) && <span className="inline-flex items-center gap-1.5"><Image src="/images/icons/villa-bathrooms.svg" alt="" width={16} height={16} />{villa.bathrooms} bathrooms</span>}
        </div>
    );

    const logo = (
        <div className="flex justify-center pt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/home/villas-logo-dark.svg" alt="Coco B Isla" width={114} height={96} className="h-[96px] w-[114px] object-contain" />
        </div>
    );

    // --- "villa-finish" confirmation screen ---
    if (submitted) {
        return (
            <section className={styles.planner}>
                {logo}
                <p className={styles.contextBar}><span className={styles.contextSparkle}>✦</span>{contextLabel}</p>

                <div className="p-5 sm:p-8">
                    <header className="text-center">
                        <h2 className="text-xl leading-7 font-bold tracking-normal text-[#1a2e4a] sm:text-2xl">Thank you. Your inquiry is safely with us.</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6a7282]">We&apos;re already planning the perfect moments for your stay.</p>
                    </header>

                    <div className="mx-auto mt-6 max-w-sm overflow-hidden rounded-2xl border border-[#e2e8f0]">
                        {heroImage ? (
                            <ResilientPhoto image={heroImage} alt={heroImageAlt || villaName} className="aspect-[4/3] w-full object-cover" />
                        ) : (
                            <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#eaf3f4] text-xs font-bold uppercase tracking-wide text-[#527079]">Image coming soon</div>
                        )}

                        <div className="space-y-3 p-5">
                            <p className="text-base font-bold uppercase tracking-wide text-[#1a2e4a]">{villaName}</p>
                                {statsRow()}
                            {Boolean(price) && (
                                <p className="text-sm text-[#1c1c1c]">From <strong className="text-base font-semibold">${price!.toLocaleString("en-US")}</strong> / night + taxes</p>
                            )}
                            {checkIn && checkOut && (
                                <p className="text-xs font-medium text-[#6a7282]">{parseIso(checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {parseIso(checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {nights} night{nights === 1 ? "" : "s"}</p>
                            )}
                        </div>
                    </div>

                    {syncWarning && <p role="alert" className="mx-auto mt-5 max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{syncWarning}</p>}

                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="mx-auto mt-6 block w-full max-w-sm rounded-lg bg-[#1a2e4a] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#264c76]"
                    >
                        Finish
                    </button>
                    <p className="mt-3 text-center text-xs text-slate-500">In no more than 24 hours we&apos;ll get back to you.</p>
                </div>
            </section>
        );
    }

    return (
        <section id="reservar" className={styles.planner}>
            {logo}
            <p className={styles.contextBar}><span className={styles.contextSparkle}>✦</span>{contextLabel}</p>
            <header className="px-6 pt-6 sm:px-8">
                <h2 className="text-lg leading-7 font-bold tracking-normal text-[#1a2e4a] uppercase">Let&apos;s Get Your Travel Planned</h2>
                <p className="mt-1 text-xs font-bold uppercase leading-4 tracking-[1.2px] text-[#99a1af]">Please complete the form below.</p>
            </header>

            <div className="p-5 sm:p-8 lg:grid lg:grid-cols-[minmax(0,604px)_minmax(400px,1fr)] lg:items-start lg:gap-8">
                {/* --- Villa summary column --- */}
                <div>
                    <div className={styles.pairHeading}>
                        {pairedStay && (
                            <>
                                <h3>{villas.map((villa) => shortVillaName(villa.name)).join(" + ")}</h3>
                                <p>{bedrooms || villas.reduce((total, villa) => total + (villa.bedrooms || 0), 0)} Total Bedrooms / Suites</p>
                            </>
                        )}
                    </div>

                    <div className={styles.mobileSummary}>
                        {villas.map((villa, index) => (
                            <div className={styles.summaryRow} key={villa.id}>
                                <div className={styles.summaryImage}>
                                    <ResilientPhoto
                                        image={villa.image || (index === 0 ? heroImage : undefined)}
                                        alt={villa.name}
                                    />
                                </div>
                                <div>
                                    <p className={styles.summaryEyebrow}>Villa</p>
                                    <p className={styles.summaryName}>{villa.name.replace(/^(Casa|Villa)\s+/i, "")}</p>
                                    {statsRow(villa)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: one complete summary per selected villa. */}
                    <div className={styles.desktopSummary}>
                        <div className={pairedStay ? styles.combinedVillaStack : undefined}>
                            {villas.map((villa, index) => (
                                <article className={styles.desktopVillaSummary} key={villa.id}>
                                    <div className={styles.desktopVillaImage}>
                                        {villa.image || (index === 0 ? heroImage : undefined) ? (
                                            <ResilientPhoto
                                                image={villa.image || (index === 0 ? heroImage : undefined)}
                                                alt={villa.name}
                                                className="h-full w-full object-cover"
                                                gallery
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[#eaf3f4] text-xs font-bold uppercase tracking-wide text-[#527079]">Image coming soon</div>
                                        )}
                                    </div>
                                    <div className={styles.desktopVillaStats}>{statsRow(villa)}</div>
                                </article>
                            ))}
                        </div>

                        <div className={styles.staySummary}>
                            {description && <p className={styles.stayDescription}>{description}</p>}

                            {(Boolean(price) || amenities.length > 0) && (
                                <div className={styles.stayCommercial}>
                                    {Boolean(price) ? (
                                        <p className={styles.stayPrice}>From <strong>${price!.toLocaleString("en-US")}</strong><span>/ night + taxes</span></p>
                                    ) : <span />}
                                    {amenities.length > 0 && (
                                        <div className={styles.stayAmenities}>
                                            {amenities.map((amenity) => (
                                                <span key={amenity}>{amenity}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile/tablet: compact villa card (thumbnail + name + stats) */}
                    <div className="hidden lg:hidden" aria-hidden="true" />
                </div>

                {/* --- Booking column --- */}
                <div className={`${styles.bookingColumn} mt-8 lg:mt-0`}>
                    {!availabilityOnline && <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-800">Availability can&apos;t be verified right now. Try reloading before submitting a request.</div>}

                    <div className={styles.calendarShell}>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#6a7282]">
                            Stay Dates{checkIn && checkOut && ` ${parseIso(checkIn).getDate()} — ${parseIso(checkOut).getDate()}`}
                        </p>

                        {/* Use one or two months according to the booking column's real width. */}
                        <div className={styles.singleCalendar}>
                            {renderMonthPanel(month, primaryCalendarDays, { showPrev: true, showNext: true })}
                        </div>

                        <div className={styles.doubleCalendar}>
                            {renderMonthPanel(month, primaryCalendarDays, { showPrev: true, showNext: false })}
                            {renderMonthPanel(secondaryMonth, secondaryCalendarDays, { showPrev: false, showNext: true })}
                        </div>

                        {dateError && <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{dateError}</p>}

                        <div className="mt-5 flex items-center gap-3 text-sm text-[#1a2e4a]">
                            <button type="button" role="switch" aria-checked={flexibleDates} aria-label="My dates are flexible" onClick={() => setFlexibleDates((value) => !value)} className={`relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2e4a] ${flexibleDates ? "bg-[#77E0F2]" : "bg-[#dfe3eb]"}`}><span className="absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow-[0_1px_4px_rgba(26,46,74,.22)] transition-transform duration-200" style={{ transform: `translateX(${flexibleDates ? 20 : 4}px)` }} /></button>
                            <span className="font-semibold">My dates are flexible<span className="block text-xs font-normal text-slate-500">I can adjust ±3 days for better availability</span></span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <p className="text-xs font-bold uppercase tracking-[0.3px] text-[#6a7282]">Number of Guests</p>
                        <div className="mt-2 flex items-center gap-3">
                            <button type="button" aria-label="Decrease guests" disabled={guests <= 1} onClick={() => updateGuests(guests - 1)} className="rounded-lg border border-[#e2e8f0] p-1.5 disabled:opacity-30"><Minus size={16} /></button>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={maxGuests}
                                step={1}
                                value={guests}
                                aria-label="Number of guests"
                                onFocus={(event) => event.currentTarget.select()}
                                onKeyDown={handleGuestsKeyDown}
                                onChange={(event) => updateGuests(event.currentTarget.valueAsNumber)}
                                className="w-8 appearance-none bg-transparent text-center font-bold text-[#1a2e4a] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button type="button" aria-label="Increase guests" disabled={guests >= maxGuests} onClick={() => updateGuests(guests + 1)} className="rounded-lg border border-[#e2e8f0] p-1.5 disabled:opacity-30"><Plus size={16} /></button>
                            <span className="text-xs font-medium text-[#6f7684]">max. {maxGuests} guests</span>
                        </div>
                    </div>

                    <form
                        noValidate
                        suppressHydrationWarning
                        onSubmit={async (event) => {
                            event.preventDefault();
                            setTouched({ firstName: true, lastName: true, email: true, phone: true, referralSource: true, travelPlans: true });
                            if (!checkIn || !checkOut || submitted || submitting || hasFormErrors) return;
                            setSubmitting(true);
                            setSubmitError(undefined);
                            setSyncWarning(undefined);
                            const response = await fetch("/api/reservations/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ villaId: villaIds[0], villaIds, villaName, checkIn, checkOut, guests, flexibleDates, firstName, lastName, email, phone: `${phoneCountryCode} ${phone}`, referralSource, travelPlans }) });
                            setSubmitting(false);
                            const result = await response.json().catch(() => null);
                            if (response.ok) {
                                setSubmitted(true);
                                if (!result?.hubspotSynced) setSyncWarning("Your request was saved, but HubSpot didn't confirm the sync. Our team will review it — no need to submit again.");
                            } else setSubmitError(result?.error || "We couldn't send your request. Please try again.");
                        }}
                        className="mt-8 space-y-4"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-xs font-bold uppercase tracking-[0.3px] text-[#6a7282]">
                                First Name
                                <input
                                    required
                                    autoComplete="given-name"
                                    name="firstName"
                                    value={firstName}
                                    onChange={handleNameChange(setFirstName)}
                                    onBlur={() => markTouched("firstName")}
                                    aria-invalid={Boolean(touched.firstName && errors.firstName)}
                                    className={fieldClass("firstName")}
                                    placeholder="Maria"
                                />
                                {touched.firstName && errors.firstName && <span className="mt-1 block text-xs font-normal normal-case text-red-600">{errors.firstName}</span>}
                            </label>
                            <label className="text-xs font-bold uppercase tracking-[0.3px] text-[#6a7282]">
                                Last Name
                                <input
                                    required
                                    autoComplete="family-name"
                                    name="lastName"
                                    value={lastName}
                                    onChange={handleNameChange(setLastName)}
                                    onBlur={() => markTouched("lastName")}
                                    aria-invalid={Boolean(touched.lastName && errors.lastName)}
                                    className={fieldClass("lastName")}
                                    placeholder="Gonzalez"
                                />
                                {touched.lastName && errors.lastName && <span className="mt-1 block text-xs font-normal normal-case text-red-600">{errors.lastName}</span>}
                            </label>
                            <label className="text-xs font-bold uppercase tracking-[0.3px] text-[#6a7282]">
                                Email Address
                                <input
                                    required
                                    autoComplete="email"
                                    type="email"
                                    inputMode="email"
                                    name="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value.trim())}
                                    onBlur={() => markTouched("email")}
                                    aria-invalid={Boolean(touched.email && errors.email)}
                                    className={fieldClass("email")}
                                    placeholder="maria@example.com"
                                />
                                {touched.email && errors.email && <span className="mt-1 block text-xs font-normal normal-case text-red-600">{errors.email}</span>}
                            </label>
                            <label className="text-xs font-bold uppercase tracking-[0.3px] text-[#6a7282]">
                                Phone Number
                                <div className={`mt-1.5 flex overflow-hidden rounded-lg border bg-white focus-within:ring-2 ${touched.phone && errors.phone ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-100" : "border-[#e2e8f0] focus-within:border-[#1a2e4a] focus-within:ring-[#dce7f4]"}`}>
                                    <select name="phoneCountryCode" aria-label="Country code" value={phoneCountryCode} onChange={(event) => setPhoneCountryCode(event.target.value)} className="w-24 border-r border-[#e2e8f0] bg-[#f1f5f9] px-2 py-2.5 text-sm font-semibold text-[#1a2e4a] outline-none">
                                        <option value="+52">🇲🇽 +52</option>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+1">🇨🇦 +1</option>
                                        <option value="+34">🇪🇸 +34</option>
                                        <option value="+44">🇬🇧 +44</option>
                                        <option value="+33">🇫🇷 +33</option>
                                        <option value="+49">🇩🇪 +49</option>
                                        <option value="+57">🇨🇴 +57</option>
                                        <option value="+54">🇦🇷 +54</option>
                                    </select>
                                    <input
                                        required
                                        autoComplete="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        type="tel"
                                        name="phone"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        onKeyDown={handlePhoneKeyDown}
                                        onPaste={handlePhonePaste}
                                        onBlur={() => markTouched("phone")}
                                        aria-invalid={Boolean(touched.phone && errors.phone)}
                                        className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none"
                                        placeholder="55 1234 5678"
                                    />
                                </div>
                                {touched.phone && errors.phone && <span className="mt-1 block text-xs font-normal normal-case text-red-600">{errors.phone}</span>}
                                {!(touched.phone && errors.phone) && <span className="mt-1.5 block text-xs font-normal normal-case text-slate-500">Numbers only, no spaces or dashes.</span>}
                            </label>
                            <label className="text-xs font-bold uppercase tracking-[0.3px] text-[#6a7282] sm:col-span-2">
                                How Did You Hear About Us?
                                <select
                                    required
                                    name="referralSource"
                                    value={referralSource}
                                    onChange={(event) => setReferralSource(event.target.value)}
                                    onBlur={() => markTouched("referralSource")}
                                    aria-invalid={Boolean(touched.referralSource && errors.referralSource)}
                                    className={fieldClass("referralSource")}
                                >
                                    <option value="" disabled>Select an option</option>
                                    {HUBSPOT_REFERRAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                                {touched.referralSource && errors.referralSource && (
                                    <span className="mt-1 block text-xs font-normal normal-case text-red-600">{errors.referralSource}</span>
                                )}
                            </label>
                            <label className="text-xs font-bold uppercase tracking-[0.3px] text-[#6a7282] sm:col-span-2">
                                Tell Us About Your Travel Plans
                                <textarea
                                    required
                                    name="travelPlans"
                                    rows={4}
                                    value={travelPlans}
                                    onChange={(event) => setTravelPlans(event.target.value)}
                                    onBlur={() => markTouched("travelPlans")}
                                    aria-invalid={Boolean(touched.travelPlans && errors.travelPlans)}
                                    className={`${fieldClass("travelPlans")} resize-y`}
                                    placeholder="Reason for travel, celebrations, preferences, or any important detail."
                                />
                                {touched.travelPlans && errors.travelPlans && <span className="mt-1 block text-xs font-normal normal-case text-red-600">{errors.travelPlans}</span>}
                            </label>
                        </div>
                        <button type="submit" disabled={!checkIn || !checkOut || submitting || submitted || !availabilityOnline} className="mt-2 w-full rounded-lg bg-[#1a2e4a] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#264c76] disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "Sending Request…" : `Submit Consultation Request${nights ? ` · ${nights} Night${nights === 1 ? "" : "s"}` : ""}`}</button>
                        <p className="text-center text-xs text-slate-500">By submitting you agree to let our team contact you to coordinate your stay.</p>
                        {submitError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{submitError}</p>}
                    </form>
                </div>
            </div>
        </section>
    );
}
