/**
 * Pre-built demo datasets for the "Try a sample" buttons.
 * Indian business context to match the BizLens AI brand voice.
 */

export type DemoDataset = {
  id: string;
  name: string;
  description: string;
  type: "csv";
  columns: string[];
  rows: (string | number)[][];
};

export const coachingDemo: DemoDataset = {
  id: "demo-coaching",
  name: "Sharma Coaching Classes — Fees.csv",
  description: "Student fee collection across Jan–May",
  type: "csv",
  columns: [
    "Student Name",
    "Class",
    "Subject",
    "Fees Due",
    "Fees Paid",
    "Month",
    "Payment Status",
  ],
  rows: [
    ["Aarav Sharma", "Class 10", "Mathematics", 3500, 3500, "January", "Paid"],
    ["Priya Patel", "Class 12", "Science", 4500, 4500, "January", "Paid"],
    ["Rohit Kumar", "Class 9", "Mathematics", 3000, 1500, "January", "Partial"],
    ["Anjali Singh", "Class 11", "Commerce", 4000, 0, "January", "Pending"],
    ["Vivek Mehta", "Class 10", "Science", 3500, 3500, "February", "Paid"],
    ["Neha Gupta", "Class 12", "Mathematics", 4500, 4500, "February", "Paid"],
    ["Arjun Yadav", "Class 9", "Science", 3000, 3000, "February", "Paid"],
    ["Pooja Joshi", "Class 11", "Arts", 3500, 0, "February", "Pending"],
    ["Karan Malhotra", "Class 10", "Commerce", 3500, 3500, "March", "Paid"],
    ["Divya Nair", "Class 12", "Science", 4500, 2250, "March", "Partial"],
    ["Aditya Verma", "Class 9", "Mathematics", 3000, 3000, "March", "Paid"],
    ["Sneha Reddy", "Class 11", "Science", 4000, 4000, "March", "Paid"],
    ["Rishi Bhatt", "Class 10", "Arts", 3500, 0, "April", "Pending"],
    ["Meera Pillai", "Class 12", "Commerce", 4500, 4500, "April", "Paid"],
    ["Siddharth Roy", "Class 9", "Mathematics", 3000, 3000, "April", "Paid"],
    ["Kavya Iyer", "Class 11", "Science", 4000, 4000, "April", "Paid"],
    ["Harsh Agarwal", "Class 10", "Science", 3500, 1750, "May", "Partial"],
    ["Tanya Kapoor", "Class 12", "Mathematics", 4500, 4500, "May", "Paid"],
    ["Dev Shah", "Class 9", "Commerce", 3000, 0, "May", "Pending"],
    ["Ishaan Mishra", "Class 11", "Mathematics", 4000, 4000, "May", "Paid"],
  ],
};

export const restaurantDemo: DemoDataset = {
  id: "demo-restaurant",
  name: "Spice Garden — Daily Sales.csv",
  description: "Item-level sales for 10 days of October",
  type: "csv",
  columns: [
    "Date",
    "Item Name",
    "Category",
    "Quantity Sold",
    "Price per Unit",
    "Total Revenue",
    "Day of Week",
  ],
  rows: [
    ["2025-10-01", "Butter Chicken", "Main Course", 24, 320, 7680, "Wednesday"],
    ["2025-10-01", "Paneer Tikka", "Starter", 18, 280, 5040, "Wednesday"],
    ["2025-10-02", "Dal Makhani", "Main Course", 31, 220, 6820, "Thursday"],
    ["2025-10-02", "Garlic Naan", "Bread", 45, 60, 2700, "Thursday"],
    ["2025-10-03", "Biryani", "Main Course", 38, 350, 13300, "Friday"],
    ["2025-10-03", "Lassi", "Beverages", 27, 80, 2160, "Friday"],
    ["2025-10-04", "Butter Chicken", "Main Course", 41, 320, 13120, "Saturday"],
    ["2025-10-04", "Gulab Jamun", "Dessert", 33, 120, 3960, "Saturday"],
    ["2025-10-05", "Chole Bhature", "Main Course", 29, 180, 5220, "Sunday"],
    ["2025-10-05", "Masala Chai", "Beverages", 52, 40, 2080, "Sunday"],
    ["2025-10-06", "Paneer Butter Masala", "Main Course", 22, 300, 6600, "Monday"],
    ["2025-10-06", "Tandoori Roti", "Bread", 38, 40, 1520, "Monday"],
    ["2025-10-07", "Biryani", "Main Course", 19, 350, 6650, "Tuesday"],
    ["2025-10-07", "Raita", "Side", 24, 60, 1440, "Tuesday"],
    ["2025-10-08", "Butter Chicken", "Main Course", 35, 320, 11200, "Wednesday"],
    ["2025-10-08", "Mango Lassi", "Beverages", 28, 100, 2800, "Wednesday"],
    ["2025-10-09", "Dal Tadka", "Main Course", 26, 200, 5200, "Thursday"],
    ["2025-10-09", "Garlic Naan", "Bread", 41, 60, 2460, "Thursday"],
    ["2025-10-10", "Biryani", "Main Course", 44, 350, 15400, "Friday"],
    ["2025-10-10", "Kulfi", "Dessert", 19, 100, 1900, "Friday"],
  ],
};

export const demoDatasets = [coachingDemo, restaurantDemo];

export function formatINR(n: number): string {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}
