
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			spacing: {
				'0.25': '0.0625rem', // 1px in rem (assuming 16px base)
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				pdv: {
					DEFAULT: '#1A1F2C',
					dark: '#141824',
					green: '#10B981',
					red: '#E11D48',
					yellow: '#D97706',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-subtle': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)',
						borderColor: 'rgba(16, 185, 129, 0.6)'
					},
					'50%': {
						boxShadow: '0 0 0 6px rgba(16, 185, 129, 0)',
						borderColor: 'rgba(16, 185, 129, 1)'
					}
				},
				'pulse-normal': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.5)',
						borderColor: 'rgba(16, 185, 129, 0.7)'
					},
					'50%': {
						boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)',
						borderColor: 'rgba(16, 185, 129, 1)'
					}
				},
				'pulse-strong': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.6)',
						borderColor: 'rgba(16, 185, 129, 0.8)'
					},
					'50%': {
						boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)',
						borderColor: 'rgba(16, 185, 129, 1)'
					}
				},
				'bounce-x': {
					'0%, 100%': { transform: 'translateX(0)' },
					'50%': { transform: 'translateX(6px)' }
				},
				'wiggle-attention': {
					'0%, 100%': { transform: 'translateX(0) scale(1)' },
					'15%': { transform: 'translateX(-3px) scale(1.02)' },
					'30%': { transform: 'translateX(3px) scale(1.02)' },
					'45%': { transform: 'translateX(-2px) scale(1.01)' },
					'60%': { transform: 'translateX(2px) scale(1.01)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
				'pulse-normal': 'pulse-normal 1.5s ease-in-out infinite',
				'pulse-strong': 'pulse-strong 1s ease-in-out infinite',
				'bounce-x': 'bounce-x 1s ease-in-out infinite',
				'wiggle-attention': 'wiggle-attention 2.5s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
