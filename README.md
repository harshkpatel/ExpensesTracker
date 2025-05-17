# Personal Expenses Tracker

A modern, locally-hosted web application for tracking personal expenses with powerful analytics and intuitive visualizations.

## Features

- 📊 Interactive dashboard with spending insights and budget tracking
- 📝 Comprehensive expense management (add, edit, delete, categorize)
- 📈 Real-time analytics with time period filtering (weekly, monthly, yearly)
- 🔍 Automatic category-based expense breakdowns and trends
- 💸 Budget tracking with visual progress indicators
- 💾 Local data storage with SQLite (privacy-focused)
- 📤 Data import/export functionality

## Tech Stack

- **Frontend**: React.js with Tailwind CSS and Chart.js
- **Backend**: Python with FastAPI
- **Database**: SQLite
- **Data Visualization**: Chart.js with customized components
- **Icons**: Lucide React

## Screenshot Gallery

[Consider adding screenshots of the application here]

## Complete Setup Instructions

### Prerequisites

- Python 3.8+ (recommended: Python 3.11)
- Node.js 16+ and npm
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/expenses-tracker.git
cd expenses-tracker
```

### Step 2: Backend Setup

1. Create and activate a Python virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Initialize the database (creates a new empty database if not present):

```bash
cd backend
python -c "from main import Base, engine; Base.metadata.create_all(bind=engine)"
```

4. Start the backend server:

```bash
python -m uvicorn main:app --reload
```

The API will be available at http://localhost:8000

### Step 3: Frontend Setup

1. Open a new terminal window and navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The application will be available at http://localhost:3000

### Step 4: Initial Configuration (New Users)

1. Access the application at http://localhost:3000
2. Go to the "Categories" tab and add some expense categories (e.g., Groceries, Rent, Transportation)
3. Start adding your expenses on the "Expenses" tab
4. View your spending insights on the Dashboard page

## Project Structure

```
expenses-tracker/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── src/
│   │   └── db/           # Database models and configuration
│   ├── data/             # SQLite database storage
│   ├── uploads/          # Temporary storage for receipt images
│   └── requirements.txt  # Python dependencies
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
```

## Usage Guide

### Dashboard

The Dashboard provides an overview of your financial activity:
- Monthly budget progress with color-coded indicators
- Month-over-month spending comparison
- Top spending categories
- Daily average expenditure
- Monthly trend chart
- Category breakdown visualization
- Recent transactions list

### Managing Expenses

1. Navigate to the "Expenses" tab
2. Add a new expense by clicking the "Add Expense" button
3. Fill in the expense details (amount, category, description, date)
4. Use the year filter and pagination to browse through your expense history
5. Edit or delete expenses as needed

### Using Analytics

1. Navigate to the "Analytics" tab
2. Select a time period (week, month, year) using the dropdown
3. View spending trends through the interactive charts
4. Analyze category breakdowns for the selected time period
5. Review insights and spending patterns specific to the selected time range

### Managing Categories

1. Navigate to the "Categories" tab
2. Add new expense categories as needed
3. Remove unused categories

### Data Import/Export

1. Navigate to the "Settings" tab
2. Click "Export Data" to download your expense database
3. Click "Import Data" to upload a previously exported database

## API Endpoints Reference

The backend provides RESTful API endpoints for all functionalities:

- `GET /expenses/` - List all expenses with pagination and filtering
- `POST /expenses/` - Create a new expense
- `GET /expenses/{id}` - Get a specific expense
- `PUT /expenses/{id}` - Update an expense
- `DELETE /expenses/{id}` - Delete an expense
- `GET /categories/` - List all categories
- `POST /categories/` - Create a new category
- `DELETE /categories/{id}` - Delete a category
- `GET /analytics/summary` - Get time-specific spending summary and statistics
- `GET /export` - Export all data
- `POST /import` - Import data

## Dependency Requirements

```
# Backend
fastapi==0.104.1
uvicorn==0.23.2
pydantic==2.4.2
python-multipart==0.0.6
sqlalchemy==2.0.25
pillow==10.0.1

# Frontend
React 18.2.0
Tailwind CSS 3.3.3
Chart.js 4.4.0
lucide-react 0.263.1
```

## Planned Future Enhancements

- Mobile app version with responsive design
- Cloud synchronization options
- Advanced budget planning and alerts
- Multiple currency support
- Financial goal setting and tracking
- Enhanced machine learning for spending pattern prediction
- Dark mode support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.