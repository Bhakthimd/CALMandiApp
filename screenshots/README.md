# CALMandi Application Screenshots

This directory is designated for device screenshots captured during physical device or emulator testing.

> **Honest Disclosure**: The development environment is running on a Windows host without an attached physical device or headless display runner. Per the project requirements, artificial or synthetic screenshots have **not** been generated or passed off as real device tests.

---

## Required Screenshots Checklist

When testing on an Android device, Android emulator, or iPhone using Expo Go, capture the following 9 screens:

| File Name | Screen | Expected View / Content | Status |
|---|---|---|---|
| `01_login.png` | **Login Screen** | Welcome greeting, CALMandi green logo, 10-digit mobile number input, Continue button. | Pending Manual Capture |
| `02_registration.png` | **Registration Screen** | Owner name, mobile number prefilled, business name, location, Owner/Operator selection pills, Register button. | Pending Manual Capture |
| `03_home_dashboard.png` | **Home Dashboard** | CALMandi header, Welcome greeting, 3 large green-and-white action cards (Customers, Categories, Products). | Pending Manual Capture |
| `04_customers.png` | **Customers List** | Header, `+ Add Customer` button, total count badge, customer cards with initial avatars (Ravi, Lakshmi, Manjunath). | Pending Manual Capture |
| `05_add_customer.png` | **Add Customer** | Header with `‹ Customers` back navigation, Customer Name, Mobile Number, Business Name inputs, Save and Cancel buttons. | Pending Manual Capture |
| `06_categories.png` | **Categories List** | Header, `+ Add Category` button, total count badge, category cards (Fruits, Vegetables, Leafy Vegetables, Dry Fruits). | Pending Manual Capture |
| `07_add_category.png` | **Add Category** | Header with `‹ Categories` back navigation, Category Name input field, Save and Cancel buttons. | Pending Manual Capture |
| `08_products.png` | **Products List** | Header, `+ Add Product` button, total count badge, product cards (Banana, Apple, Tomato, Spinach, Almonds) with category & unit badges. | Pending Manual Capture |
| `09_add_product.png` | **Add Product** | Header with `‹ Products` back navigation, Product Name input, dynamic category selection chips, 7 unit selection chips, Save and Cancel buttons. | Pending Manual Capture |

---

## How to Capture Device Screenshots

### Android
- **Via Physical Device**: Press `Power + Volume Down` simultaneously, or use `adb exec-out screencap -p > screenshots/01_login.png`.
- **Via Android Emulator**: Click the Camera icon on the emulator toolbar or run `adb exec-out screencap -p > screenshots/<name>.png`.

### iPhone
- **Via Physical Device**: Press `Side Button + Volume Up` simultaneously.
- **Via Mac iOS Simulator**: Press `Cmd + S` in Simulator or navigate to `File > Save Screen`.
