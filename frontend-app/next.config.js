/** @type {import('next').NextConfig} */
const nextConfig = {
  // PENTING: Mengaktifkan mode standalone untuk Docker
  output: 'standalone',
  
  // Opsional: Mematikan strict mode jika mengganggu
  reactStrictMode: false,
  
  // Opsional: Mengizinkan import gambar dari luar (jika perlu)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig