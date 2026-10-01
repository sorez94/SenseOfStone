import localFont from "next/font/local";

/** Latin display font used by SOS. */
export const glacier = localFont({
  src: "../assets/fonts/Glacier.ttf",
  weight: "400",
  display: "swap",
  variable: "--font-glacier",
});

/** Persian font used by SOS: Vazirmatn variable (100–900), SIL OFL 1.1. */
export const vazirmatn = localFont({
  src: "../assets/fonts/Vazirmatn-Variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-vazirmatn",
});
