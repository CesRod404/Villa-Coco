// // components/ui/Button.tsx
// "use client";

// import { ButtonHTMLAttributes, forwardRef } from "react";

// type ButtonVariant = "primary" | "secondary" | "outline";
// type ButtonSize = "sm" | "md" | "lg";

// interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
//   variant?: ButtonVariant;
//   size?: ButtonSize;
//   isLoading?: boolean;
// }

// const variantStyles: Record<ButtonVariant, string> = {
//   primary:
//     "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600",
//   secondary:
//     "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400",
//   outline:
//     "border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400",
// };

// const sizeStyles: Record<ButtonSize, string> = {
//   sm: "text-sm px-3 py-1.5 rounded-md",
//   md: "text-sm px-4 py-2.5 rounded-lg",
//   lg: "text-base px-6 py-3 rounded-lg",
// };

// const Button = forwardRef<HTMLButtonElement, ButtonProps>(
//   (
//     {
//       variant = "primary",
//       size = "md",
//       isLoading = false,
//       disabled,
//       className = "",
//       children,
//       ...props
//     },
//     ref
//   ) => {
//     return (
//       <button
//         ref={ref}
//         disabled={disabled || isLoading}
//         className={`
//           inline-flex items-center justify-center gap-2 font-medium
//           transition-colors duration-150
//           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
//           disabled:opacity-50 disabled:cursor-not-allowed
//           ${variantStyles[variant]}
//           ${sizeStyles[size]}
//           ${className}
//         `}
//         {...props}
//       >
//         {isLoading && (
//           <svg
//             className="h-4 w-4 animate-spin"
//             viewBox="0 0 24 24"
//             fill="none"
//             aria-hidden="true"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//             />
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//             />
//           </svg>
//         )}
//         {children}
//       </button>
//     );
//   }
// );

// Button.displayName = "Button";

// export default Button;