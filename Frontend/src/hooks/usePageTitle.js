import { useEffect } from 'react';

/**
 * Sets the browser tab title to: "🧬 FederiGene | {title}"
 * Usage: usePageTitle('Training Jobs')
 */
export default function usePageTitle(title) {
    useEffect(() => {
        const prev = document.title;
        document.title = title ? `FederiGene | ${title}` : 'FederiGene';
        return () => {
            document.title = prev;
        };
    }, [title]);
}
