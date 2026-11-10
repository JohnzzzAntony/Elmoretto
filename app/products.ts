// El Moretto's coffee-bean range, as listed on elmoretto.ie. Prices and copy must match the live shop.
export const shopUrl = "https://www.elmoretto.ie/shop/";

export const products = [
  {
    id: "amalfi", name: "Amalfi", blend: "100% Arabica", strength: "Aromatic", price: "€22.00",
    notes: "Soft and aromatic, with notes of dried fruit and chocolate.",
    url: "https://www.elmoretto.ie/product/coffee-beans-amalfi/", image: "/brand/amalfi.webp", width: 335, height: 832,
  },
  {
    id: "sorrento", name: "Sorrento", blend: "50% Arabica · 50% Robusta", strength: "Strong", price: "€17.00",
    notes: "The classic blend: balanced and rounded, with an intense, persistent aroma.",
    url: "https://www.elmoretto.ie/product/coffee-beans-sorrento/", image: "/brand/sorrento.webp", width: 368, height: 861,
  },
  {
    id: "positano", name: "Positano", blend: "80% Arabica · 20% Robusta", strength: "Mild", price: "€18.00",
    notes: "A medium roast with chocolate and caramel, balanced by a delicate acidity.",
    url: "https://www.elmoretto.ie/product/coffee-beans-positano/", image: "/brand/positano.webp", width: 366, height: 859,
  },
] as const;

export const contact = {
  address: "Unit 406D, Grants Park, Greenogue Business Park, Rathcoole, Co. Dublin D24 W7KP",
  email: "sales@elmoretto.ie",
  phones: ["+353 87 295 0746", "+353 1 414 0820"],
};
