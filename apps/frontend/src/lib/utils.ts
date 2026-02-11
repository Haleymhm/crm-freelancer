import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind CSS evitando conflictos
 * Utiliza clsx para manejar condicionales y twMerge para resolver conflictos
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
