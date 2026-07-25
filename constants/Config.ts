const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL no está definida — copiar .env.example a .env y ajustar la URL del backend.',
  );
}

export const Config = {
  apiUrl,
};
