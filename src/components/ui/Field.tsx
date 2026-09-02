"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode, useId } from "react";

const baseControl =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50";

function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  hintId,
  errorId,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  hintId?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-800">
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint} hintId={hintId} errorId={errorId}>
      <input
        id={fieldId}
        aria-describedby={errorId || hintId}
        aria-invalid={error ? true : undefined}
        className={`${baseControl} ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: string }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint} hintId={hintId} errorId={errorId}>
      <textarea
        id={fieldId}
        aria-describedby={errorId || hintId}
        aria-invalid={error ? true : undefined}
        className={`${baseControl} min-h-[110px] resize-y ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  error,
  hint,
  id,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; hint?: string }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint} hintId={hintId} errorId={errorId}>
      <select
        id={fieldId}
        aria-describedby={errorId || hintId}
        aria-invalid={error ? true : undefined}
        className={`${baseControl} ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
