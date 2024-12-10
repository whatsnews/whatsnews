# WhatsNews 🗞️

> ⚠️ **Note**: This project is currently under active development and is not yet ready for production use.

WhatsNews is an intelligent news aggregation and summarization platform that uses LLMs to provide personalized news digests based on custom prompts. It consolidates news from various sources and presents them in a way that matters to you.

![logo whatsnews](https://github.com/user-attachments/assets/edaf87c4-ac35-400b-a680-159279a133a6)



## 🚀 Features (Planned/In Development)

- **Custom News Prompts**: Create personalized prompts to get news summaries exactly how you want them
- **Multiple Time Windows**: Get updates in 10-minute intervals, hourly, or daily digests
- **Smart Summarization**: Leverages LLMs to provide intelligent, context-aware news summaries
- **RSS Integration**: Aggregate news from multiple RSS feeds (more sources coming soon)
- **Flexible Categories**: Cross-category news consolidation based on your interests
- **User Management**: Personal account to manage your prompts and preferences

## 🛠️ Tech Stack

- Backend: Python/FastAPI
- Database: PostgreSQL
- LLM Integration: (TBD)
- RSS Parser: (TBD)
- Frontend: (Coming Soon)

## 🏗️ Project Status

WhatsNews is in early development. Here's what's working and what's not:

✅ Project Structure  
✅ Basic Architecture Design  
⏳ FastAPI Backend (In Progress)  
⏳ Database Models (In Progress)  
❌ LLM Integration  
❌ RSS Feed Integration  
❌ Frontend Development  
❌ User Authentication  

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- PostgreSQL
- Virtual Environment

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/whatsnews.git
cd whatsnews

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your configurations

# Run migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload
```

## 🤝 Contributing

We're excited to have you contribute! Please take a look at our contributing guidelines (coming soon) before submitting a pull request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 WhatsNews

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
