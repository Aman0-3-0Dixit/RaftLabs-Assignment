import type { MenuItem } from "@/lib/repositories/types";

/**
 * Generates a food-related image URL from LoremFlickr.
 *
 * - 480x320 matches the approximate aspect ratio used by the menu cards.
 * - Keywords are used to find a relevant food photograph.
 * - "all" asks LoremFlickr to match all supplied keywords.
 * - lock gives each menu item a stable image.
 */
function img(keywords: string[], lock: number) {
  const query = keywords.map(encodeURIComponent).join(",");

  return `https://loremflickr.com/480/320/${query}/all?lock=${lock}`;
}

export const MENU_SEED: MenuItem[] = [
  {
    id: "menu_margherita",
    name: "Margherita Pizza",
    description:
      "San Marzano tomato, fresh mozzarella, basil, olive oil.",
    priceCents: 129900,
    imageUrl: img(["margherita", "pizza"], 1),
    category: "Pizza",
    isAvailable: true,
  },

  {
    id: "menu_pepperoni",
    name: "Pepperoni Pizza",
    description:
      "Classic pepperoni with a blend of mozzarella and provolone.",
    priceCents: 149900,
    imageUrl: img(["pepperoni", "pizza"], 2),
    category: "Pizza",
    isAvailable: true,
  },

  {
    id: "menu_veggie_supreme",
    name: "Veggie Supreme Pizza",
    description:
      "Bell peppers, onion, mushroom, olives, sweet corn.",
    priceCents: 139900,
    imageUrl: img(["vegetable", "pizza"], 3),
    category: "Pizza",
    isAvailable: true,
  },

  {
    id: "menu_classic_burger",
    name: "Classic Cheeseburger",
    description:
      "Beef patty, cheddar, lettuce, tomato, house sauce.",
    priceCents: 89900,
    imageUrl: img(["cheeseburger", "burger"], 4),
    category: "Burgers",
    isAvailable: true,
  },

  {
    id: "menu_veg_burger",
    name: "Crispy Veg Burger",
    description:
      "Herbed potato-pea patty, slaw, chipotle mayo.",
    priceCents: 79900,
    imageUrl: img(["vegetable", "burger"], 5),
    category: "Burgers",
    isAvailable: true,
  },

  {
    id: "menu_double_smash",
    name: "Double Smash Burger",
    description:
      "Two smashed patties, American cheese, pickles, onion.",
    priceCents: 109900,
    imageUrl: img(["double", "cheeseburger"], 6),
    category: "Burgers",
    isAvailable: true,
  },

  {
    id: "menu_caesar_salad",
    name: "Chicken Caesar Salad",
    description:
      "Grilled chicken, romaine, parmesan, garlic croutons.",
    priceCents: 99900,
    imageUrl: img(["chicken", "caesar", "salad"], 7),
    category: "Salads",
    isAvailable: true,
  },

  {
    id: "menu_greek_salad",
    name: "Greek Salad",
    description:
      "Cucumber, tomato, feta, kalamata olives, oregano.",
    priceCents: 84900,
    imageUrl: img(["greek", "salad"], 8),
    category: "Salads",
    isAvailable: true,
  },

  {
    id: "menu_loaded_fries",
    name: "Loaded Fries",
    description:
      "Crispy fries, cheese sauce, jalapeños, spring onion.",
    priceCents: 59900,
    imageUrl: img(["loaded", "fries"], 9),
    category: "Sides",
    isAvailable: true,
  },

  {
    id: "menu_onion_rings",
    name: "Beer-Battered Onion Rings",
    description:
      "Thick-cut onion rings, crisp batter, smoky dip.",
    priceCents: 54900,
    imageUrl: img(["onion", "rings"], 10),
    category: "Sides",
    isAvailable: true,
  },

  {
    id: "menu_lemonade",
    name: "Fresh Mint Lemonade",
    description:
      "Cold-pressed lemon, mint, a touch of honey.",
    priceCents: 34900,
    imageUrl: img(["mint", "lemonade"], 11),
    category: "Drinks",
    isAvailable: true,
  },

  {
    id: "menu_cold_brew",
    name: "Cold Brew Coffee",
    description:
      "18-hour slow-steeped, served over ice.",
    priceCents: 39900,
    imageUrl: img(["cold", "brew", "coffee"], 12),
    category: "Drinks",
    isAvailable: true,
  },

  {
    id: "menu_brownie",
    name: "Fudge Brownie",
    description:
      "Dense dark-chocolate brownie, sea salt flake.",
    priceCents: 44900,
    imageUrl: img(["chocolate", "brownie"], 13),
    category: "Desserts",
    isAvailable: true,
  },

  {
    id: "menu_churros",
    name: "Cinnamon Churros",
    description:
      "Six pieces, cinnamon sugar, chocolate dip.",
    priceCents: 49900,
    imageUrl: img(["churros"], 14),
    category: "Desserts",
    isAvailable: true,
  },

  {
    id: "menu_tiramisu",
    name: "Tiramisu Cup",
    description:
      "Espresso-soaked ladyfingers, mascarpone, cocoa dust.",
    priceCents: 54900,
    imageUrl: img(["tiramisu"], 15),
    category: "Desserts",
    isAvailable: true,
  },

  {
    id: "menu_chicken_wrap",
    name: "Grilled Chicken Wrap",
    description:
      "Peri-peri chicken, lettuce, garlic mayo, tortilla.",
    priceCents: 74900,
    imageUrl: img(["chicken", "wrap"], 16),
    category: "Wraps",
    isAvailable: true,
  },

  {
    id: "menu_falafel_wrap",
    name: "Falafel Wrap",
    description:
      "Crispy falafel, hummus, pickled turnip, tahini.",
    priceCents: 69900,
    imageUrl: img(["falafel", "wrap"], 17),
    category: "Wraps",
    isAvailable: true,
  },

  {
    id: "menu_paneer_wrap",
    name: "Tandoori Paneer Wrap",
    description:
      "Char-grilled paneer, mint chutney, red onion.",
    priceCents: 72900,
    imageUrl: img(["paneer", "wrap"], 18),
    category: "Wraps",
    isAvailable: true,
  },

  {
    id: "menu_alfredo",
    name: "Fettuccine Alfredo",
    description:
      "Parmesan cream sauce, cracked black pepper.",
    priceCents: 114900,
    imageUrl: img(["fettuccine", "alfredo"], 19),
    category: "Pasta",
    isAvailable: true,
  },

  {
    id: "menu_arrabbiata",
    name: "Penne Arrabbiata",
    description:
      "Spicy tomato sauce, garlic, chili flakes, basil.",
    priceCents: 109900,
    imageUrl: img(["penne", "arrabbiata"], 20),
    category: "Pasta",
    isAvailable: true,
  },

  {
    id: "menu_carbonara",
    name: "Spaghetti Carbonara",
    description:
      "Guanciale, egg yolk, pecorino, black pepper.",
    priceCents: 119900,
    imageUrl: img(["spaghetti", "carbonara"], 21),
    category: "Pasta",
    isAvailable: true,
  },

  {
    id: "menu_teriyaki_bowl",
    name: "Chicken Teriyaki Bowl",
    description:
      "Steamed rice, teriyaki chicken, sesame, scallion.",
    priceCents: 99900,
    imageUrl: img(["chicken", "teriyaki", "bowl"], 22),
    category: "Rice Bowls",
    isAvailable: true,
  },

  {
    id: "menu_burrito_bowl",
    name: "Burrito Bowl",
    description:
      "Cilantro rice, black beans, salsa, guacamole, corn.",
    priceCents: 94900,
    imageUrl: img(["burrito", "bowl"], 23),
    category: "Rice Bowls",
    isAvailable: true,
  },

  {
    id: "menu_poke_bowl",
    name: "Spicy Tuna Poke Bowl",
    description:
      "Sushi rice, tuna, edamame, avocado, spicy mayo.",
    priceCents: 124900,
    imageUrl: img(["tuna", "poke", "bowl"], 24),
    category: "Rice Bowls",
    isAvailable: true,
  },

  {
    id: "menu_tomato_soup",
    name: "Roasted Tomato Soup",
    description:
      "Slow-roasted tomato, basil oil, garlic crouton.",
    priceCents: 64900,
    imageUrl: img(["tomato", "soup"], 25),
    category: "Soups",
    isAvailable: true,
  },

  {
    id: "menu_miso_soup",
    name: "Miso Soup",
    description:
      "Tofu, wakame seaweed, scallion, dashi broth.",
    priceCents: 59900,
    imageUrl: img(["miso", "soup"], 26),
    category: "Soups",
    isAvailable: true,
  },

  {
    id: "menu_iced_tea",
    name: "Peach Iced Tea",
    description:
      "Black tea, fresh peach, light syrup, over ice.",
    priceCents: 34900,
    imageUrl: img(["peach", "iced", "tea"], 27),
    category: "Drinks",
    isAvailable: true,
  },

  {
    id: "menu_mango_smoothie",
    name: "Mango Smoothie",
    description:
      "Alphonso mango, yogurt, a hint of cardamom.",
    priceCents: 44900,
    imageUrl: img(["mango", "smoothie"], 28),
    category: "Drinks",
    isAvailable: true,
  },

  {
    id: "menu_garlic_bread",
    name: "Garlic Cheese Bread",
    description:
      "Toasted baguette, garlic butter, mozzarella.",
    priceCents: 49900,
    imageUrl: img(["garlic", "cheese", "bread"], 29),
    category: "Sides",
    isAvailable: true,
  },
];
