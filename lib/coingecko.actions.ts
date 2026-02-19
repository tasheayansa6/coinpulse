'use server';
import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) throw new Error('Could not get base url');
if (!API_KEY) throw new Error('Could not get api key');

export type QueryParams = Record<string, string | number | boolean | undefined>;

type CoinGeckoErrorBody = {
    error?: string;
    status?: { error_message?: string };
};

export async function fetcher<T>(
    endpoint: string,
    params?: QueryParams,
    revalidate = 60
): Promise<T> {
    const url = qs.stringifyUrl(
        { url: `${BASE_URL}/${endpoint}`, query: params },
        { skipEmptyString: true, skipNull: true }
    );

    const response = await fetch(url, {
        headers: {
            'x-cg-pro-api-key': API_KEY, // required for Pro API
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        next: { revalidate },
    });

    if (!response.ok) {
        let message = response.statusText;
        try {
            const errorBody: CoinGeckoErrorBody = await response.json();
            message = errorBody?.status?.error_message || errorBody?.error || message;
        } catch {
            // fallback: keep default statusText
        }
        throw new Error(`API Error: ${response.status}: ${message}`);
    }

    return response.json() as Promise<T>;
}
