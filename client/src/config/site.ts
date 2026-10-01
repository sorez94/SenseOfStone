/** Brand and contact details (non-translatable). Translatable copy lives in /messages. */
export const siteConfig = {
  name: "Sense Of Stone",
  logo: "/logo.png",
  contact: {
    phones: [
      { display: "+98 912 711 6788", whatsapp: "989127116788" },
      { display: "+98 912 484 5654", whatsapp: "989124845654" },
    ],
    instagram: "SenseOfStone",
    /** Google Maps embed of the showroom (Modern Center, Yaft Abad), shown on the contact page. */
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.5805960819325!2d51.350421999999995!3d35.6627035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f8e010001a27fb3%3A0x6a0b5f0c5126dc92!2z2YXYsdqp2LIg2K7YsduM2K8g2YXYr9ix2YYg2LPZhtiq2LEgTW9kZXJuIENlbnRlcg!5e0!3m2!1sen!2s!4v1747051305855!5m2!1sen!2s",
  },
} as const;
