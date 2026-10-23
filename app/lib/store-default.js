// Store publication v1, adopted as the project default on 2026-10-23.
// Keep the uploaded artwork with the source so resets do not depend on remote storage.
export const STORE_DEFAULT_DOCUMENT = {
  "theme": {
    "color": "#eeeef0",
    "fontFamily": "sans",
    "backgroundColor": "#09090a"
  },
  "children": [
    {
      "id": "n610ecd6729fb4f6b8c79836c5379d753",
      "name": "Mağaza başlığı",
      "type": "section",
      "props": {
        "anchor": ""
      },
      "style": {
        "maxWidth": 1440,
        "paddingTop": 80,
        "paddingLeft": 32,
        "paddingRight": 32,
        "paddingBottom": 80
      },
      "mobile": {},
      "tablet": {},
      "children": [
        {
          "id": "ne5c018a0b41e438b8ae6f9018a2fa54e",
          "name": "Metin",
          "type": "text",
          "props": {
            "text": "STORE / CATALOGUE"
          },
          "style": {
            "color": "#a6a6aa",
            "fontSize": 11,
            "lineHeight": 1.65,
            "letterSpacing": 3
          },
          "mobile": {},
          "tablet": {},
          "children": []
        },
        {
          "id": "n5d161f31b73844efb0286b5ac4bcef5b",
          "name": "Başlık",
          "type": "heading",
          "props": {
            "text": "Available\neditions.",
            "level": "h2"
          },
          "style": {
            "fontSize": 64,
            "fontWeight": "400",
            "lineHeight": 1.1,
            "letterSpacing": -2
          },
          "mobile": {
            "fontSize": 32
          },
          "tablet": {},
          "children": []
        },
        {
          "id": "n4d85f78869764697b4c294ecd2e10319",
          "name": "Görsel",
          "type": "image",
          "props": {
            "alt": "",
            "src": "/defaults/store-20261023.jpg",
            "href": ""
          },
          "style": {
            "objectFit": "cover"
          },
          "mobile": {},
          "tablet": {},
          "children": []
        },
        {
          "id": "nc33b1b9549104fa492b164fcdb892c05",
          "name": "Metin",
          "type": "text",
          "props": {
            "text": "Physical objects and digital masters from SIDE:II and its imprints."
          },
          "style": {
            "fontSize": 18,
            "lineHeight": 1.65
          },
          "mobile": {},
          "tablet": {},
          "children": []
        }
      ]
    },
    {
      "id": "ndbf49e2bee064ce892b5445e8fbb388a",
      "name": "Mağaza bileşeni",
      "type": "native",
      "props": {
        "slot": "store-catalogue"
      },
      "style": {},
      "mobile": {},
      "tablet": {},
      "children": []
    },
    {
      "id": "n76c2a68d31c544aba050fa14c758a818",
      "name": "Buton / bağlantı",
      "type": "button",
      "props": {
        "href": "/store",
        "text": "Keşfet →",
        "newTab": false
      },
      "style": {},
      "mobile": {},
      "tablet": {},
      "children": []
    }
  ],
  "schemaVersion": 1
};

