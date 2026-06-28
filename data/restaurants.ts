export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Mains' | 'Sides' | 'Drinks';
};

export type Restaurant = {
  id: string;
  name: string;
  shortName: string;
  heroImage: string;
  rating: string;
  reviewCount: string;
  cuisine: string;
  time: string;
  deliveryFee: number;
  minOrder: number;
  distance: string;
  menu: MenuItem[];
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'The Burger Joint',
    shortName: 'Burger Place',
    heroImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    rating: '4.8',
    reviewCount: '400+',
    cuisine: 'Burgers & Fast Food',
    time: '25-35 min',
    deliveryFee: 2.99,
    minOrder: 10,
    distance: '1.2 miles',
    menu: [
      { id: 'm1', name: 'Classic Angus Beef', description: 'Premium Angus beef patty, cheddar, lettuce, tomato, and our house sauce', price: 12.50, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80', category: 'Mains' },
      { id: 'm2', name: 'Spicy Chicken Deluxe', description: 'Crispy buttermilk chicken breast, jalapeños, slaw, and spicy mayo', price: 11.00, image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&q=80', category: 'Mains' },
      { id: 'm3', name: 'Double Smash Burger', description: 'Two smashed patties, American cheese, pickles, onions, and special sauce', price: 15.99, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&q=80', category: 'Mains' },
      { id: 's1', name: 'Truffle Parmesan Fries', description: 'Hand-cut russet potatoes tossed in truffle oil and aged parmesan cheese', price: 5.50, image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300&q=80', category: 'Sides' },
      { id: 's2', name: 'Golden Onion Rings', description: 'Beer-battered jumbo onion rings served with a side of zesty ranch', price: 4.95, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=300&q=80', category: 'Sides' },
      { id: 's3', name: 'Sweet Potato Fries', description: 'Crispy sweet potato fries with chipotle aioli dipping sauce', price: 4.50, image: 'https://images.unsplash.com/photo-1576777647209-e8733d7b851d?w=300&q=80', category: 'Sides' },
      { id: 'd1', name: 'Craft Root Beer', description: 'Small-batch brewed root beer with notes of vanilla and sarsaparilla', price: 3.50, image: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=300&q=80', category: 'Drinks' },
      { id: 'd2', name: 'Fresh Lemonade', description: 'Freshly squeezed lemonade with mint and a touch of honey', price: 3.00, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&q=80', category: 'Drinks' },
    ],
  },
  {
    id: '2',
    name: 'Artisan Slices & Co.',
    shortName: 'Artisan Pizza',
    heroImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    rating: '4.7',
    reviewCount: '300+',
    cuisine: 'Italian · Neapolitan Pizza',
    time: '25-35 min',
    deliveryFee: 0.99,
    minOrder: 12,
    distance: '0.8 miles',
    menu: [
      { id: 'm1', name: 'Margherita Classica', description: 'San Marzano tomatoes, fresh mozzarella, basil, extra virgin olive oil', price: 14.00, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80', category: 'Mains' },
      { id: 'm2', name: 'Truffle Mushroom', description: 'Cremini mushrooms, truffle cream, fontina, fresh thyme', price: 17.50, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&q=80', category: 'Mains' },
      { id: 'm3', name: 'Pepperoni Royale', description: 'Double pepperoni, mozzarella, chili flakes, honey drizzle', price: 16.00, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&q=80', category: 'Mains' },
      { id: 's1', name: 'Garlic Knots', description: 'Soft-baked dough knots tossed in garlic butter and parsley', price: 5.00, image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80', category: 'Sides' },
      { id: 's2', name: 'Caprese Salad', description: 'Buffalo mozzarella, heirloom tomatoes, fresh basil, balsamic glaze', price: 8.50, image: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=300&q=80', category: 'Sides' },
      { id: 'd1', name: 'San Pellegrino', description: 'Italian sparkling mineral water, chilled', price: 2.50, image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=300&q=80', category: 'Drinks' },
      { id: 'd2', name: 'Limonata', description: 'Sparkling Italian lemonade with Sicilian lemons', price: 3.50, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&q=80', category: 'Drinks' },
    ],
  },
  {
    id: '3',
    name: 'Green Harvest Bowls',
    shortName: 'Harvest Bowls',
    heroImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    rating: '4.9',
    reviewCount: '500+',
    cuisine: 'Healthy · Salad · Vegan',
    time: '15-20 min',
    deliveryFee: 0,
    minOrder: 10,
    distance: '0.5 miles',
    menu: [
      { id: 'm1', name: 'Avocado Power Bowl', description: 'Brown rice, avocado, edamame, cucumber, sesame dressing', price: 14.00, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80', category: 'Mains' },
      { id: 'm2', name: 'Ubar Signature Bowl', description: 'Quinoa, roasted veggies, falafel, tahini, pomegranate', price: 15.50, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', category: 'Mains' },
      { id: 'm3', name: 'Grilled Chicken Bowl', description: 'Herb-grilled chicken, kale, sweet potato, turmeric tahini', price: 16.00, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80', category: 'Mains' },
      { id: 's1', name: 'Miso Soup', description: 'Traditional Japanese miso with tofu, wakame, green onion', price: 3.50, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80', category: 'Sides' },
      { id: 's2', name: 'Edamame', description: 'Steamed edamame pods with sea salt and chili flakes', price: 4.00, image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=300&q=80', category: 'Sides' },
      { id: 'd1', name: 'Green Detox Juice', description: 'Spinach, cucumber, apple, ginger, lemon', price: 5.50, image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=300&q=80', category: 'Drinks' },
      { id: 'd2', name: 'Coconut Water', description: '100% natural coconut water, chilled', price: 3.50, image: 'https://images.unsplash.com/photo-1555685804-1df9c8f69133?w=300&q=80', category: 'Drinks' },
    ],
  },
];

export function getRestaurant(id: string): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}
