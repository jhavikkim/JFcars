'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Cog,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import {
  type Lang,
  type Currency,
  type ContactPreference,
  type Car,
  type UserAccount,
  type OrderItem,
  type OrderRecord,
  money,
  currencyLabel,
  localeFor,
  supportedCurrencies,
  rentalRate,
  rentalDaysBetween,
  localize,
  numberFor,
  carPlace,
  citiesByCountry,
  accountMarkets,
  contactPreferenceLabels,
  languageLabels,
  profileCompletion,
  orderStatus,
  accessibilityCopy,
  formValue,
  ui,
  marketCopy,
  flowCopy,
  profileCopy,
} from '@/components/jfcars/config';
import { useDialog } from '@/components/jfcars/useDialog';
export function AccountLayer({
  panel,
  close,
  goAuth,
  user,
  setUser,
  authMode,
  setAuthMode,
  cart,
  setCart,
  rentalCart,
  setRentalCart,
  inventory,
  saved,
  partRequestCount,
  orders,
  setOrders,
  lang,
  currency,
  onCurrencyChange,
  onLanguageChange,
  verificationStatus,
}: {
  panel: 'auth' | 'cart' | 'profile';
  close: () => void;
  goAuth: () => void;
  user: UserAccount | null;
  setUser: (u: UserAccount | null) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (m: 'signin' | 'signup') => void;
  cart: number[];
  setCart: (v: number[]) => void;
  rentalCart: number[];
  setRentalCart: (v: number[]) => void;
  inventory: Car[];
  saved: number[];
  partRequestCount: number;
  orders: OrderRecord[];
  setOrders: (orders: OrderRecord[]) => void;
  lang: Lang;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onLanguageChange: (language: Lang) => void;
  verificationStatus?: 'success' | 'invalid' | null;
}) {
  const [profileTab, setProfileTab] = useState('overview');
  const [notice, setNotice] = useState('');
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');
  const [rentalConsent, setRentalConsent] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveFailed, setProfileSaveFailed] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const authFormRef = useRef<HTMLFormElement>(null);
  const f = flowCopy[lang];
  const u = ui[lang];
  const p = profileCopy[lang];
  const a = accessibilityCopy[lang];
  const m = marketCopy[lang];
  const authText = {
    en: {
      passwordHint: 'Use 10–128 characters.',
      genericError: 'We could not complete this request. Please try again.',
      existing: 'An account already exists for this email.',
      invalid: 'Email or password is incorrect.',
      busy: 'Please wait…',
      checkInbox:
        'Check your inbox and open the verification link before signing in.',
      verifyFirst: 'Verify your email before signing in.',
      resend: 'Send verification email again',
      resent: 'A new verification email has been sent.',
      verified: 'Your email is verified. You can now sign in.',
      invalidLink:
        'This verification link is invalid or expired. Sign in to request another.',
    },
    fr: {
      passwordHint: 'Utilisez entre 10 et 128 caractères.',
      genericError: 'Impossible de terminer cette demande. Réessayez.',
      existing: 'Un compte existe déjà pour cette adresse e-mail.',
      invalid: 'L’adresse e-mail ou le mot de passe est incorrect.',
      busy: 'Veuillez patienter…',
      checkInbox:
        'Consultez votre boîte mail et ouvrez le lien de vérification avant de vous connecter.',
      verifyFirst: 'Vérifiez votre adresse e-mail avant de vous connecter.',
      resend: 'Renvoyer l’e-mail de vérification',
      resent: 'Un nouvel e-mail de vérification a été envoyé.',
      verified: 'Votre e-mail est vérifié. Vous pouvez maintenant vous connecter.',
      invalidLink:
        'Ce lien est invalide ou expiré. Connectez-vous pour en demander un autre.',
    },
    es: {
      passwordHint: 'Usa entre 10 y 128 caracteres.',
      genericError: 'No pudimos completar la solicitud. Inténtalo de nuevo.',
      existing: 'Ya existe una cuenta con este correo.',
      invalid: 'El correo o la contraseña son incorrectos.',
      busy: 'Espera un momento…',
      checkInbox:
        'Revisa tu bandeja de entrada y abre el enlace de verificación antes de iniciar sesión.',
      verifyFirst: 'Verifica tu correo antes de iniciar sesión.',
      resend: 'Enviar de nuevo el correo de verificación',
      resent: 'Se ha enviado un nuevo correo de verificación.',
      verified: 'Tu correo está verificado. Ya puedes iniciar sesión.',
      invalidLink:
        'Este enlace no es válido o ha caducado. Inicia sesión para solicitar otro.',
    },
    pt: {
      passwordHint: 'Utilize entre 10 e 128 caracteres.',
      genericError: 'Não foi possível concluir o pedido. Tente novamente.',
      existing: 'Já existe uma conta com este e-mail.',
      invalid: 'O e-mail ou a palavra-passe está incorreto.',
      busy: 'Aguarde…',
      checkInbox:
        'Consulte a sua caixa de entrada e abra o link de verificação antes de iniciar sessão.',
      verifyFirst: 'Verifique o seu e-mail antes de iniciar sessão.',
      resend: 'Reenviar e-mail de verificação',
      resent: 'Foi enviado um novo e-mail de verificação.',
      verified: 'O seu e-mail foi verificado. Já pode iniciar sessão.',
      invalidLink:
        'Este link é inválido ou expirou. Inicie sessão para pedir outro.',
    },
  }[lang];
  const completion = profileCompletion(user);
  const profileComplete = completion === 100;
  const today = new Date().toISOString().slice(0, 10);
  const minimumReturnDate = rentalStart
    ? new Date(Date.parse(`${rentalStart}T00:00:00Z`) + 86_400_000)
        .toISOString()
        .slice(0, 10)
    : today;
  useDialog(close);
  const hasRentals = rentalCart.length > 0;
  const rentalDays = rentalDaysBetween(rentalStart, rentalEnd);
  const rentalReady =
    !hasRentals ||
    (rentalConsent &&
      rentalStart >= today &&
      rentalDays >= 1 &&
      rentalDays <= 60);
  const picked = [
    ...inventory
      .filter((car) => cart.includes(car.id))
      .map((car) => ({ car, kind: 'buy' as const, amount: car.price })),
    ...inventory
      .filter((car) => rentalCart.includes(car.id))
      .map((car) => ({
        car,
        kind: 'rent' as const,
        amount: rentalRate(car) * rentalDays,
      })),
  ];
  const submitAuth = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setAuthBusy(true);
    setAuthError('');
    setAuthNotice('');
    setVerificationPending(false);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          name: formValue(data, 'authName'),
          email: formValue(data, 'authEmail'),
          password: formValue(data, 'authPassword'),
          language: lang,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        code?: string;
        verificationRequired?: boolean;
      };
      if (!response.ok) {
        if (response.status === 403 && result.code === 'email_unverified') {
          setAuthError(authText.verifyFirst);
          setVerificationPending(true);
          return;
        }
        setAuthError(
          response.status === 409
            ? authText.existing
            : response.status === 401
              ? authText.invalid
              : authText.genericError,
        );
        return;
      }
      if (result.verificationRequired) {
        setAuthNotice(authText.checkInbox);
        setVerificationPending(false);
        return;
      }
      window.location.reload();
    } catch {
      setAuthError(authText.genericError);
    } finally {
      setAuthBusy(false);
    }
  };
  const resendVerification = async () => {
    if (!authFormRef.current) return;
    const data = new FormData(authFormRef.current);
    setAuthBusy(true);
    setAuthError('');
    setAuthNotice('');
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'resend-verification',
          email: formValue(data, 'authEmail'),
          password: formValue(data, 'authPassword'),
          language: lang,
        }),
      });
      if (!response.ok) {
        setAuthError(
          response.status === 401 ? authText.invalid : authText.genericError,
        );
        return;
      }
      setAuthNotice(authText.resent);
      setVerificationPending(false);
    } catch {
      setAuthError(authText.genericError);
    } finally {
      setAuthBusy(false);
    }
  };
  const signOut = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'signout' }),
      });
    } finally {
      window.location.reload();
    }
  };
  const saveProfile = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    const nextUser: UserAccount = {
      name: formValue(data, 'profileName', user.name),
      email: user.email,
      phone: formValue(data, 'profilePhone'),
      country: formValue(data, 'profileCountry'),
      city: formValue(data, 'profileCity'),
      preferredContact: formValue(
        data,
        'profileContact',
        'WhatsApp',
      ) as ContactPreference,
      preferredLanguage: formValue(data, 'profileLanguage', lang) as Lang,
      preferredCurrency: formValue(
        data,
        'profileCurrency',
        currency,
      ) as Currency,
    };
    setProfileSaving(true);
    setProfileSaveFailed(false);
    setNotice('');
    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profile: nextUser,
          cart,
          rentalCart,
          saved,
        }),
      });
      if (!response.ok) throw new Error('Profile update failed');
      const result = (await response.json()) as { user?: UserAccount };
      const savedUser = result.user || nextUser;
      setUser(savedUser);
      if (savedUser.preferredLanguage)
        onLanguageChange(savedUser.preferredLanguage);
      if (savedUser.preferredCurrency)
        onCurrencyChange(savedUser.preferredCurrency);
      setNotice(flowCopy[savedUser.preferredLanguage || lang].profileSaved);
    } catch {
      setProfileSaveFailed(true);
      setNotice(p.saveError);
    } finally {
      setProfileSaving(false);
    }
  };
  const submitCheckout = async () => {
    if (!user) {
      goAuth();
      return;
    }
    if (hasRentals && (!rentalConsent || rentalDays < 1 || rentalDays > 60)) {
      setNotice(f.rentalRequired);
      return;
    }
    setCheckoutBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: picked.map(({ car, kind }) => ({
            carId: car.id,
            kind,
          })),
          rentalDetails: hasRentals
            ? {
                startDate: rentalStart,
                endDate: rentalEnd,
                termsAccepted: rentalConsent,
              }
            : undefined,
        }),
      });
      if (!response.ok) throw new Error('Order request failed');
      const result = (await response.json()) as {
        orderId: string;
        items: OrderItem[];
        total: number;
      };
      setOrders([
        {
          id: result.orderId,
          email: user.email,
          items: result.items,
          total: result.total,
          status: 'New',
          createdAt: new Date().toISOString(),
        },
        ...orders,
      ]);
      setCart([]);
      setRentalCart([]);
      setCheckoutDone(true);
    } catch {
      setNotice(
        lang === 'fr'
          ? 'La demande n’a pas pu être envoyée. Réessayez.'
          : lang === 'es'
            ? 'No se pudo enviar la solicitud. Inténtalo de nuevo.'
            : lang === 'pt'
              ? 'Não foi possível enviar o pedido. Tente novamente.'
              : 'We could not submit the request. Please try again.',
      );
    } finally {
      setCheckoutBusy(false);
    }
  };
  return (
    <div
      className="layer"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      role="presentation"
    >
      <dialog
        open
        className={`drawer ${panel}`}
        aria-label={
          panel === 'auth'
            ? f.account
            : panel === 'cart'
              ? u.cart
              : user?.name || 'Profile'
        }
      >
        <button className="drawer-close" onClick={close} aria-label={u.close}>
          <X />
        </button>
        {panel === 'auth' && (
          <div className="auth-box">
            <button className="logo logo-button" onClick={close}>
              <span>JF</span>cars<i>.</i>
            </button>
            <p className="auth-kicker">{f.account}</p>
            <h2>{authMode === 'signin' ? f.welcome : f.moving}</h2>
            <p>{authMode === 'signin' ? f.signinDesc : f.signupDesc}</p>
            <div className="auth-tabs">
              <button
                className={authMode === 'signin' ? 'active' : ''}
                onClick={() => {
                  setAuthError('');
                  setAuthNotice('');
                  setVerificationPending(false);
                  setAuthMode('signin');
                }}
              >
                {f.signIn}
              </button>
              <button
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => {
                  setAuthError('');
                  setAuthNotice('');
                  setVerificationPending(false);
                  setAuthMode('signup');
                }}
              >
                {f.create}
              </button>
            </div>
            {verificationStatus && !authNotice && (
              <output
                className={
                  verificationStatus === 'success'
                    ? 'auth-success'
                    : 'auth-error'
                }
              >
                {verificationStatus === 'success'
                  ? authText.verified
                  : authText.invalidLink}
              </output>
            )}
            <form ref={authFormRef} onSubmit={submitAuth}>
              {authMode === 'signup' && (
                <label>
                  {f.name}
                  <input
                    name="authName"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
              )}
              <label>
                {f.email}
                <input
                  name="authEmail"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </label>
              <label>
                {f.password}
                <input
                  name="authPassword"
                  type="password"
                  autoComplete={
                    authMode === 'signin' ? 'current-password' : 'new-password'
                  }
                  minLength={10}
                  maxLength={128}
                  required
                />
                <small className="auth-hint">{authText.passwordHint}</small>
              </label>
              {authError && (
                <p className="auth-error" role="alert">
                  {authError}
                </p>
              )}
              {authNotice && (
                <output className="auth-success">
                  {authNotice}
                </output>
              )}
              {verificationPending && (
                <button
                  type="button"
                  className="auth-resend"
                  onClick={resendVerification}
                  disabled={authBusy}
                >
                  {authText.resend}
                </button>
              )}
              <button className="auth-submit" disabled={authBusy}>
                {authBusy
                  ? authText.busy
                  : authMode === 'signin'
                    ? f.signIn
                    : f.create}
                {!authBusy && <ArrowRight />}
              </button>
            </form>
            <p className="auth-profile-note">
              <User />
              <span>{p.authNote}</span>
            </p>
            <small>{f.continue}</small>
          </div>
        )}
        {panel === 'cart' && (
          <div className="cart-box">
            <p className="auth-kicker">{f.selection}</p>
            <h2>
              {u.cart} <span>{cart.length + rentalCart.length}</span>
            </h2>
            {checkoutDone ? (
              <div className="checkout-success" aria-live="polite">
                <Check />
                <h3>{f.checkoutDone}</h3>
                <button onClick={close}>{f.browse}</button>
              </div>
            ) : picked.length ? (
              <>
                <div className="cart-items">
                  {picked.map(({ car: c, kind, amount }) => (
                    <article key={`${kind}-${c.id}`}>
                      <Image
                        src={c.image}
                        alt={`${c.make} ${c.model}`}
                        width={320}
                        height={200}
                        unoptimized
                      />
                      <div>
                        <b>
                          {c.make} {c.model}
                        </b>
                        <span>
                          {c.year} · {numberFor(c.km, lang)} km
                        </span>
                        <small className="cart-kind">
                          {kind === 'rent'
                            ? `${f.rental} · ${f.pickupAt}: ${carPlace(c, lang)}`
                            : f.purchase}
                        </small>
                        <strong>
                          {kind === 'rent'
                            ? `${money(rentalRate(c), lang, currency)}/${f.day}`
                            : money(amount, lang, currency)}
                        </strong>
                        {kind === 'buy' && c.origin === 'abroad' && (
                          <small className="cart-import-note">
                            {m.abroadAvailability}. {m.importNote}
                          </small>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          kind === 'rent'
                            ? setRentalCart(
                                rentalCart.filter((x) => x !== c.id),
                              )
                            : setCart(cart.filter((x) => x !== c.id))
                        }
                        aria-label={`${a.remove} ${c.make} ${c.model}`}
                      >
                        <X />
                      </button>
                    </article>
                  ))}
                </div>
                {hasRentals && (
                  <fieldset className="rental-request-fields">
                    <legend>{f.rentalDates}</legend>
                    <div>
                      <label>
                        {f.rentalStart}
                        <input
                          type="date"
                          value={rentalStart}
                          min={today}
                          onChange={(event) => {
                            const nextStart = event.target.value;
                            setRentalStart(nextStart);
                            if (rentalEnd && rentalEnd <= nextStart)
                              setRentalEnd('');
                          }}
                          required
                        />
                      </label>
                      <label>
                        {f.rentalEnd}
                        <input
                          type="date"
                          value={rentalEnd}
                          min={minimumReturnDate}
                          onChange={(event) => setRentalEnd(event.target.value)}
                          required
                        />
                      </label>
                    </div>
                    <label className="rental-consent">
                      <input
                        type="checkbox"
                        checked={rentalConsent}
                        onChange={(event) =>
                          setRentalConsent(event.target.checked)
                        }
                      />
                      <span>{f.rentalConsent}</span>
                    </label>
                  </fieldset>
                )}
                <div className="cart-total">
                  <span>{f.estimated}</span>
                  <b>
                    {rentalReady
                      ? money(
                          picked.reduce((n, item) => n + item.amount, 0),
                          lang,
                          currency,
                        )
                      : f.chooseDates}
                  </b>
                </div>
                <p className="checkout-note">{f.checkoutNote}</p>
                <button
                  className="checkout"
                  onClick={() => void submitCheckout()}
                  disabled={checkoutBusy || (!!user && !rentalReady)}
                >
                  {checkoutBusy
                    ? lang === 'fr'
                      ? 'Envoi…'
                      : lang === 'es'
                        ? 'Enviando…'
                        : lang === 'pt'
                          ? 'A enviar…'
                          : 'Submitting…'
                    : user
                      ? f.checkout
                      : f.signinContinue}
                  <ArrowRight />
                </button>
                {notice && (
                  <p className="form-notice" aria-live="polite">
                    {notice}
                  </p>
                )}
                {!user && (
                  <button
                    className="cart-signin"
                    onClick={() => {
                      setAuthMode('signup');
                      goAuth();
                    }}
                  >
                    {f.create}
                  </button>
                )}
              </>
            ) : (
              <div className="cart-empty">
                <ShoppingBag />
                <h3>{f.emptyCart}</h3>
                <p>{f.emptyCartP}</p>
                <button onClick={close}>{f.browse}</button>
              </div>
            )}
          </div>
        )}
        {panel === 'profile' && user && (
          <div className="profile-box">
            <div className="profile-head">
              <span>{user.name.slice(0, 1)}</span>
              <div>
                <p>{p.welcome}</p>
                <h2>{user.name}</h2>
                <small>{user.email}</small>
                <div className="profile-head-meta">
                  {user.phone && <span>{user.phone}</span>}
                  {(user.city || user.country) && (
                    <span>
                      <MapPin />
                      {[user.city, localize(user.country, lang)]
                        .filter((value) => value && value !== '—')
                        .join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <nav>
              {[
                ['overview', p.tabs[0], User],
                ['orders', p.tabs[1], Package],
                ['rentals', p.tabs[2], CalendarDays],
                ['settings', p.tabs[3], Settings],
              ].map(([id, label, Icon]) => (
                <button
                  key={String(id)}
                  className={profileTab === id ? 'active' : ''}
                  onClick={() => setProfileTab(String(id))}
                >
                  <Icon />
                  {String(label)}
                </button>
              ))}
            </nav>
            <div className="profile-content">
              {profileTab === 'overview' && (
                <>
                  <h3>{p.glance}</h3>
                  <div className="profile-stats">
                    <div>
                      <Heart />
                      <b>{saved.length}</b>
                      <span>{p.saved}</span>
                    </div>
                    <div>
                      <ShoppingCart />
                      <b>{cart.length + rentalCart.length}</b>
                      <span>{p.cart}</span>
                    </div>
                    <div>
                      <Cog />
                      <b>{partRequestCount}</b>
                      <span>{p.parts}</span>
                    </div>
                  </div>
                  <h4>{p.completion}</h4>
                  <div
                    className={`profile-completion${profileComplete ? ' complete' : ''}`}
                  >
                    <div>
                      <span>{profileComplete ? <Check /> : <User />}</span>
                      <div>
                        <b>
                          {profileComplete ? p.complete : p.completion} ·{' '}
                          {completion}%
                        </b>
                        <p>
                          {profileComplete ? p.completeText : p.incompleteText}
                        </p>
                      </div>
                      {!profileComplete && (
                        <button onClick={() => setProfileTab('settings')}>
                          {p.completeAction}
                          <ArrowRight />
                        </button>
                      )}
                    </div>
                    <progress
                      className="profile-progress"
                      aria-label={p.completion}
                      max={100}
                      value={completion}
                    />
                  </div>
                  <h4>{p.details}</h4>
                  <div className="profile-detail-grid">
                    <div>
                      <span>{p.phone}</span>
                      <b>{user.phone || p.notProvided}</b>
                    </div>
                    <div>
                      <span>
                        {p.city} · {p.country}
                      </span>
                      <b>
                        {user.city || user.country
                          ? [user.city, localize(user.country, lang)]
                              .filter((value) => value && value !== '—')
                              .join(' · ')
                          : p.notProvided}
                      </b>
                    </div>
                    <div>
                      <span>{p.preferredContact}</span>
                      <b>
                        {user.preferredContact
                          ? contactPreferenceLabels[lang][user.preferredContact]
                          : p.notProvided}
                      </b>
                    </div>
                    <div>
                      <span>{p.preferredLanguage}</span>
                      <b>
                        {user.preferredLanguage
                          ? languageLabels[lang][user.preferredLanguage]
                          : p.notProvided}
                      </b>
                    </div>
                    <div>
                      <span>
                        {lang === 'fr'
                          ? 'Devise préférée'
                          : lang === 'es'
                            ? 'Moneda preferida'
                            : lang === 'pt'
                              ? 'Moeda preferida'
                              : 'Preferred currency'}
                      </span>
                      <b>{currencyLabel(user.preferredCurrency || currency)}</b>
                    </div>
                  </div>
                </>
              )}
              {profileTab === 'orders' && (
                <ProfileOrders
                  orders={orders.filter((order) =>
                    order.items.some((item) => item.kind === 'buy'),
                  )}
                  emptyTitle={p.noPurchases}
                  emptyText={p.purchasesText}
                  lang={lang}
                  currency={currency}
                />
              )}
              {profileTab === 'rentals' && (
                <ProfileOrders
                  orders={orders.filter((order) =>
                    order.items.some((item) => item.kind === 'rent'),
                  )}
                  emptyTitle={p.noRentals}
                  emptyText={p.rentalsText}
                  lang={lang}
                  currency={currency}
                />
              )}
              {profileTab === 'settings' && (
                <form
                  className="profile-settings-form"
                  onSubmit={(event) => void saveProfile(event)}
                >
                  <div className="profile-form-intro">
                    <h3>{p.settings}</h3>
                    <p>{p.settingsText}</p>
                  </div>
                  <div className="profile-form-grid">
                    <label>
                      {f.name}
                      <input
                        name="profileName"
                        defaultValue={user.name}
                        autoComplete="name"
                        maxLength={100}
                        required
                      />
                    </label>
                    <label>
                      {f.email}
                      <input
                        name="profileEmail"
                        type="email"
                        defaultValue={user.email}
                        autoComplete="email"
                        readOnly
                      />
                      <small>{p.emailManaged}</small>
                    </label>
                    <label>
                      {p.phone}
                      <input
                        name="profilePhone"
                        type="tel"
                        defaultValue={user.phone || ''}
                        autoComplete="tel"
                        minLength={7}
                        maxLength={40}
                        placeholder="+242 06 000 0000"
                        required
                      />
                    </label>
                    <label>
                      {p.country}
                      <select
                        name="profileCountry"
                        defaultValue={user.country || ''}
                        required
                      >
                        <option value="" disabled>
                          {p.chooseCountry}
                        </option>
                        {accountMarkets.map((market) => (
                          <option value={market} key={market}>
                            {market === 'Angola'
                              ? `${localize(market, lang)} — Cabinda`
                              : localize(market, lang)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {p.city}
                      <input
                        name="profileCity"
                        defaultValue={user.city || ''}
                        autoComplete="address-level2"
                        list="profile-city-suggestions"
                        maxLength={80}
                        required
                      />
                      <datalist id="profile-city-suggestions">
                        {Object.values(citiesByCountry)
                          .flat()
                          .map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                      </datalist>
                    </label>
                    <label>
                      {p.preferredContact}
                      <select
                        name="profileContact"
                        defaultValue={user.preferredContact || 'WhatsApp'}
                        required
                      >
                        {(
                          ['WhatsApp', 'Phone', 'Email'] as ContactPreference[]
                        ).map((contact) => (
                          <option key={contact} value={contact}>
                            {contactPreferenceLabels[lang][contact]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {p.preferredLanguage}
                      <select
                        name="profileLanguage"
                        defaultValue={user.preferredLanguage || lang}
                        required
                      >
                        {(['en', 'fr', 'es', 'pt'] as Lang[]).map(
                          (language) => (
                            <option key={language} value={language}>
                              {languageLabels[lang][language]}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      {lang === 'fr'
                        ? 'Devise préférée'
                        : lang === 'es'
                          ? 'Moneda preferida'
                          : lang === 'pt'
                            ? 'Moeda preferida'
                            : 'Preferred currency'}
                      <select
                        name="profileCurrency"
                        defaultValue={user.preferredCurrency || currency}
                        required
                      >
                        {supportedCurrencies.map((code) => (
                          <option key={code} value={code}>
                            {currencyLabel(code)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button className="save-profile" disabled={profileSaving}>
                    {profileSaving ? p.saving : p.save}
                  </button>
                  {notice && (
                    <p
                      className={`form-notice${profileSaveFailed ? ' error' : ''}`}
                      aria-live="polite"
                    >
                      {!profileSaveFailed && <Check />}
                      {notice}
                    </p>
                  )}
                </form>
              )}
            </div>
            <button className="signout" onClick={signOut}>
              <LogOut />
              {p.signout}
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
export function ProfileEmpty({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Package;
  title: string;
  text: string;
}) {
  return (
    <div className="profile-empty">
      <Icon />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function ProfileOrders({
  orders,
  emptyTitle,
  emptyText,
  lang,
  currency,
}: {
  orders: OrderRecord[];
  emptyTitle: string;
  emptyText: string;
  lang: Lang;
  currency: Currency;
}) {
  if (!orders.length)
    return <ProfileEmpty icon={Package} title={emptyTitle} text={emptyText} />;
  return (
    <div className="profile-order-list">
      {orders.map((order) => (
        <article key={order.id}>
          <div>
            <b>{order.items.map((item) => item.vehicle).join(', ')}</b>
            <span>
              {new Date(order.createdAt).toLocaleDateString(localeFor(lang))}
            </span>
            {order.items.some((item) => item.rentalStart) && (
              <span>
                {order.items
                  .filter((item) => item.rentalStart)
                  .map(
                    (item) =>
                      `${item.rentalStart} → ${item.rentalEnd} · ${flowCopy[lang].pickupAt}: ${item.pickup}`,
                  )
                  .join(' | ')}
              </span>
            )}
          </div>
          <strong>{money(order.total, lang, currency)}</strong>
          <small>{orderStatus(order.status, lang)}</small>
        </article>
      ))}
    </div>
  );
}
