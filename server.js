import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB file with sample data if it doesn't exist
function initDatabase() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      books: [
        {
          id: 'b-101',
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          isbn: '978-0743273565',
          category: 'Classic Fiction',
          publishedYear: 1925,
          totalCopies: 5,
          availableCopies: 3,
          coverImage: 'https://covers.openlibrary.org/b/id/13028546-L.jpg',
          addedAt: new Date().toISOString()
        },
        {
          id: 'b-102',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          author: 'Robert C. Martin',
          isbn: '978-0132350884',
          category: 'Computer Science',
          publishedYear: 2008,
          totalCopies: 4,
          availableCopies: 2,
          coverImage: 'https://covers.openlibrary.org/b/id/15126503-L.jpg',
          addedAt: new Date().toISOString()
        },
        {
          id: 'b-103',
          title: 'Sapiens: A Brief History of Humankind',
          author: 'Yuval Noah Harari',
          isbn: '978-0062316097',
          category: 'History / Anthropology',
          publishedYear: 2011,
          totalCopies: 6,
          availableCopies: 5,
          coverImage: 'https://covers.openlibrary.org/b/id/8594920-L.jpg',
          addedAt: new Date().toISOString()
        },
        {
          id: 'b-104',
          title: 'Dune',
          author: 'Frank Herbert',
          isbn: '978-0441172719',
          category: 'Sci-Fi',
          publishedYear: 1965,
          totalCopies: 3,
          availableCopies: 1,
          coverImage: 'https://covers.openlibrary.org/b/id/15166231-L.jpg',
          addedAt: new Date().toISOString()
        },
        {
          id: 'b-105',
          title: 'Atomic Habits',
          author: 'James Clear',
          isbn: '978-0735211292',
          category: 'Self-Improvement',
          publishedYear: 2018,
          totalCopies: 8,
          availableCopies: 6,
          coverImage: 'https://covers.openlibrary.org/b/id/12886417-L.jpg',
          addedAt: new Date().toISOString()
        }
      ],
      members: [
        {
          id: 'm-201',
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          phone: '+1 555-0199',
          membershipType: 'Student',
          joinedDate: '2025-01-10'
        },
        {
          id: 'm-202',
          name: 'Sophia Chen',
          email: 'sophia.c@example.com',
          phone: '+1 555-0144',
          membershipType: 'Faculty',
          joinedDate: '2024-11-04'
        },
        {
          id: 'm-203',
          name: 'Liam Vance',
          email: 'liam.v@example.com',
          phone: '+1 555-0182',
          membershipType: 'General',
          joinedDate: '2025-02-15'
        }
      ],
      issues: [
        {
          id: 'iss-301',
          bookId: 'b-101',
          bookTitle: 'The Great Gatsby',
          memberId: 'm-201',
          memberName: 'Alex Rivera',
          issueDate: '2026-03-20',
          dueDate: '2026-04-03',
          returnDate: null,
          status: 'issued' // 'issued' or 'returned'
        },
        {
          id: 'iss-302',
          bookId: 'b-102',
          bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          memberId: 'm-202',
          memberName: 'Sophia Chen',
          issueDate: '2026-03-15',
          dueDate: '2026-03-29',
          returnDate: null,
          status: 'issued'
        },
        {
          id: 'iss-303',
          bookId: 'b-104',
          bookTitle: 'Dune',
          memberId: 'm-203',
          memberName: 'Liam Vance',
          issueDate: '2026-03-10',
          dueDate: '2026-03-24',
          returnDate: null,
          status: 'issued'
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

function readData() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { books: [], members: [], issues: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

initDatabase();

// --- STATS API ---
app.get('/api/stats', (req, res) => {
  const data = readData();
  const totalBooksCount = data.books.reduce((sum, b) => sum + (Number(b.totalCopies) || 0), 0);
  const availableBooksCount = data.books.reduce((sum, b) => sum + (Number(b.availableCopies) || 0), 0);
  const activeIssues = data.issues.filter(i => i.status === 'issued').length;
  const totalMembers = data.members.length;
  
  // overdue check
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = data.issues.filter(i => i.status === 'issued' && i.dueDate < today).length;

  res.json({
    totalTitles: data.books.length,
    totalBooksCount,
    availableBooksCount,
    activeIssues,
    overdueCount,
    totalMembers
  });
});

// --- BOOKS CRUD ---
app.get('/api/books', (req, res) => {
  const { search, category } = req.query;
  const data = readData();
  let list = data.books;

  if (category && category !== 'All') {
    list = list.filter(b => b.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(b => 
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.toLowerCase().includes(q))
    );
  }

  res.json(list);
});

app.post('/api/books', (req, res) => {
  const { title, author, isbn, category, publishedYear, totalCopies, coverImage } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required.' });
  }

  const data = readData();
  const copies = parseInt(totalCopies) || 1;
  const newBook = {
    id: 'b-' + Date.now(),
    title: title.trim(),
    author: author.trim(),
    isbn: isbn ? isbn.trim() : 'N/A',
    category: category || 'General',
    publishedYear: parseInt(publishedYear) || new Date().getFullYear(),
    totalCopies: copies,
    availableCopies: copies,
    coverImage: coverImage && coverImage.trim().length > 0 
      ? coverImage.trim() 
      : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    addedAt: new Date().toISOString()
  };

  data.books.unshift(newBook);
  writeData(data);
  res.status(201).json(newBook);
});

app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, category, publishedYear, totalCopies, coverImage } = req.body;
  const data = readData();
  const bookIndex = data.books.findIndex(b => b.id === id);

  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const book = data.books[bookIndex];
  const oldTotal = book.totalCopies;
  const newTotal = parseInt(totalCopies) || oldTotal;
  const issuedCopies = oldTotal - book.availableCopies;

  if (newTotal < issuedCopies) {
    return res.status(400).json({ 
      error: `Cannot reduce total copies below currently borrowed count (${issuedCopies}).` 
    });
  }

  book.title = title ? title.trim() : book.title;
  book.author = author ? author.trim() : book.author;
  book.isbn = isbn ? isbn.trim() : book.isbn;
  book.category = category || book.category;
  book.publishedYear = parseInt(publishedYear) || book.publishedYear;
  book.totalCopies = newTotal;
  book.availableCopies = newTotal - issuedCopies;
  if (coverImage) book.coverImage = coverImage.trim();

  writeData(data);
  res.json(book);
});

app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();

  // Check if book has active issues
  const hasActiveIssues = data.issues.some(i => i.bookId === id && i.status === 'issued');
  if (hasActiveIssues) {
    return res.status(400).json({ error: 'Cannot delete book that is currently checked out by members.' });
  }

  data.books = data.books.filter(b => b.id !== id);
  writeData(data);
  res.json({ success: true, message: 'Book deleted successfully' });
});

// --- MEMBERS CRUD ---
app.get('/api/members', (req, res) => {
  const data = readData();
  res.json(data.members);
});

app.post('/api/members', (req, res) => {
  const { name, email, phone, membershipType } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const data = readData();
  const newMember = {
    id: 'm-' + Date.now(),
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : 'N/A',
    membershipType: membershipType || 'General',
    joinedDate: new Date().toISOString().split('T')[0]
  };

  data.members.unshift(newMember);
  writeData(data);
  res.status(201).json(newMember);
});

app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();

  const hasActiveIssues = data.issues.some(i => i.memberId === id && i.status === 'issued');
  if (hasActiveIssues) {
    return res.status(400).json({ error: 'Cannot remove member with pending borrowed books.' });
  }

  data.members = data.members.filter(m => m.id !== id);
  writeData(data);
  res.json({ success: true, message: 'Member removed successfully' });
});

// --- ISSUE & RETURN OPERATIONS ---
app.get('/api/issues', (req, res) => {
  const data = readData();
  res.json(data.issues);
});

app.post('/api/issues', (req, res) => {
  const { bookId, memberId, days } = req.body;
  if (!bookId || !memberId) {
    return res.status(400).json({ error: 'Book and Member are required.' });
  }

  const data = readData();
  const book = data.books.find(b => b.id === bookId);
  const member = data.members.find(m => m.id === memberId);

  if (!book) return res.status(404).json({ error: 'Book not found.' });
  if (!member) return res.status(404).json({ error: 'Member not found.' });

  if (book.availableCopies <= 0) {
    return res.status(400).json({ error: 'No copies currently available to issue.' });
  }

  // Issue date & Due date
  const now = new Date();
  const issueDate = now.toISOString().split('T')[0];
  const duration = parseInt(days) || 14;
  const dueDateObj = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
  const dueDate = dueDateObj.toISOString().split('T')[0];

  const newIssue = {
    id: 'iss-' + Date.now(),
    bookId: book.id,
    bookTitle: book.title,
    memberId: member.id,
    memberName: member.name,
    issueDate,
    dueDate,
    returnDate: null,
    status: 'issued'
  };

  book.availableCopies -= 1;
  data.issues.unshift(newIssue);
  writeData(data);

  res.status(201).json(newIssue);
});

app.post('/api/issues/:id/return', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const issue = data.issues.find(i => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: 'Issue record not found.' });
  }

  if (issue.status === 'returned') {
    return res.status(400).json({ error: 'This book has already been returned.' });
  }

  issue.status = 'returned';
  issue.returnDate = new Date().toISOString().split('T')[0];

  const book = data.books.find(b => b.id === issue.bookId);
  if (book && book.availableCopies < book.totalCopies) {
    book.availableCopies += 1;
  }

  writeData(data);
  res.json({ success: true, issue });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Library Management System running on http://localhost:${PORT}`);
});
