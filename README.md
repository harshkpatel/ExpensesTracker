# Personal Expenses Tracker

A locally-hosted web application for tracking personal expenses with receipt scanning and ML-based optimization features.

## Features

- 📝 Basic expense entry and tracking
- 📊 Analytics dashboard with spending breakdowns
- 📷 Receipt scanning with automatic data extraction
- 🔍 Item categorization (manual and automatic)
- ✏️ Editing capabilities for all expense data
- 💾 Local data storage (SQLite database)
- 🧠 ML features for cost optimization
- 📤 Data import/export functionality

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Python with FastAPI
- **Database**: SQLite
- **Receipt OCR**: Tesseract OCR
- **Machine Learning**: Basic algorithms (expandable)

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn
- Tesseract OCR

### Backend Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/expenses-tracker.git
   cd expenses-tracker
   ```

2. Create a virtual environment and activate it
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies
   ```
   pip install -r requirements.txt
   ```

4. Install Tesseract OCR (required for receipt scanning)

   **On Ubuntu/Debian:**
   ```
   sudo apt update
   sudo apt install tesseract-ocr
   ```

   **On macOS:**
   ```
   brew install tesseract
   ```

   **On Windows:**
   Download and install from https://github.com/UB-Mannheim/tesseract/wiki

5. Start the backend server
   ```
   cd backend
   uvicorn main:app --reload
   ```
   The API will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory
   ```
   cd frontend
   ```

2. Install dependencies
   ```
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```
   npm start
   # or
   yarn start
   ```
   The application will be available at http://localhost:3000

## Project Structure

```
expenses-tracker/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   ├── data/             # SQLite database storage
│   └── uploads/          # Temporary storage for receipt images
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page layouts
│   │   ├── utils/        # Helper functions
│   │   ├── App.js        # Main application component
│   │   └── index.js      # Entry point
│   ├── package.json
│   └── tailwind.config.js
└── README.md

## Usage Guide

### Adding Expenses

1. Navigate to the "Expenses" tab
2. Fill in the expense details (amount, category, description, date)
3. Click "Add Expense"

### Scanning Receipts

1. Navigate to the "Scan Receipt" tab
2. Upload an image of your receipt
3. Review the automatically extracted data
4. Edit any incorrect information
5. Click "Save" to add the expense

### Viewing Analytics

1. Navigate to the "Analytics" tab
2. Use the time period filter to view spending for different time frames
3. Analyze your spending patterns by category
4. View ML-powered suggestions for optimization (appears after sufficient data)

### Managing Categories

1. Navigate to the "Settings" tab
2. Add new expense categories
3. Remove unused categories

### Import/Export Data

1. Navigate to the "Settings" tab
2. Click "Export Data" to download your expense database
3. Click "Import Data" to upload a previously exported database

## API Endpoints

The backend provides the following RESTful API endpoints:

- `GET /expenses/` - List all expenses with filtering options
- `POST /expenses/` - Create a new expense
- `GET /expenses/{id}` - Get a specific expense
- `PUT /expenses/{id}` - Update an expense
- `DELETE /expenses/{id}` - Delete an expense
- `GET /categories/` - List all categories
- `POST /categories/` - Create a new category
- `DELETE /categories/{id}` - Delete a category
- `GET /analytics/summary` - Get spending summary and statistics
- `POST /scan-receipt/` - OCR scan a receipt image
- `GET /ml/optimize` - Get ML-based optimization suggestions
- `GET /export` - Export all data
- `POST /import` - Import data

## Requirements

```
# Backend
fastapi==0.104.1
uvicorn==0.23.2
pydantic==2.4.2
python-multipart==0.0.6
pillow==10.0.1
pytesseract==0.3.10
opencv-python==4.8.1.78
numpy==1.26.0

# Frontend
React 18.2.0
Tailwind CSS 3.3.3
lucide-react 0.263.1
```

## Future Enhancements

- Mobile app version
- Cloud sync options
- Budget setting and alerts
- Advanced ML models for better prediction
- Receipt scan improvements
- Multiple currency support
- Financial goal tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.