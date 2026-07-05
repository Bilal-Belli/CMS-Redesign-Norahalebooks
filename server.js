const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration - SIMPLIFIED AND FIXED
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // Changed to true
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Set up template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Ensure directories exist
const uploadDir = path.join(__dirname, 'public/uploads');
const dataDir = path.join(__dirname, 'data');
const imagesDataFile = path.join(__dirname, 'data', 'images.json');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(imagesDataFile)) {
    fs.writeFileSync(imagesDataFile, JSON.stringify([]));
}

// Helper functions
const getImages = () => {
    try {
        return JSON.parse(fs.readFileSync(imagesDataFile, 'utf8'));
    } catch {
        return [];
    }
};

const saveImages = (images) => {
    fs.writeFileSync(imagesDataFile, JSON.stringify(images, null, 2));
};

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

// Mock users
const users = [
    {
        id: 1,
        email: 'admin@example.com',
        password: 'admin123'
    }
];

// Auth middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// ============ ROUTES ============

// Root
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

// Login GET
app.get('/admin/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('admin-login', {
        error: null,
        title: 'Admin Login'
    });
});

// Login POST
app.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user || password !== user.password) {
        return res.render('admin-login', {
            error: 'Invalid email or password',
            title: 'Admin Login'
        });
    }

    req.session.user = {
        id: user.id,
        email: user.email
    };

    req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        res.redirect('/dashboard');
    });
});

// Logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/admin/login');
    });
});

// Dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { activePage: 'dashboard', user: req.session.user });
});

// Settings
const settingsDataFile = path.join(__dirname, 'data', 'settings.json');

// Helper functions for settings
const getSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsDataFile, 'utf8'));
    } catch {
        return {};
    }
};

const saveSettings = (settings) => {
    fs.writeFileSync(settingsDataFile, JSON.stringify(settings, null, 2));
};

// ============ SETTINGS ROUTES ============

// GET - Display settings page
app.get('/settings', isAuthenticated, (req, res) => {
    const settings = getSettings();
    res.render('site-settings', {
        activePage: 'settings',
        user: req.session.user,
        settings: settings,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save settings
app.post('/settings/save', isAuthenticated, (req, res) => {
    try {
        const {
            siteTitle,
            tagline,
            footerText,
            ogTitle,
            ogDescription,
            ogImageUrl,
            contactEmail,
            navHome,
            navAbout,
            navBooks,
            navBenefits,
            navBlog,
            navContact
        } = req.body;

        const settings = {
            siteTitle: siteTitle || "Nora Hale Books",
            tagline: tagline || "",
            footerText: footerText || "",
            ogTitle: ogTitle || "",
            ogDescription: ogDescription || "",
            ogImageUrl: ogImageUrl || "",
            contactEmail: contactEmail || "",
            navigation: {
                home: navHome || "Home",
                about: navAbout || "About",
                books: navBooks || "Books",
                benefits: navBenefits || "Recipes",
                blog: navBlog || "Blogs",
                contact: navContact || "Connect"
            }
        };

        saveSettings(settings);
        res.redirect('/settings?success=Settings saved successfully');
    } catch (error) {
        console.error('Save settings error:', error);
        res.redirect('/settings?error=Failed to save settings');
    }
});

// POST - Reset settings to defaults
app.post('/settings/reset', isAuthenticated, (req, res) => {
    try {
        const defaultSettings = {
            siteTitle: "Nora Hale Books",
            tagline: "Natural Wellness & Healthy Living",
            footerText: "© 2026 Nora Hale Books. All rights reserved.",
            ogTitle: "Nora Hale Books — Author of Castor Oil for Life & Simple Habits for a Vibrant Life",
            ogDescription: "Discover natural wellness with Nora Hale. Author of Castor Oil for Life and Simple Habits for a Vibrant Life.",
            ogImageUrl: "https://example.com/og-image.jpg",
            contactEmail: "pjhester84@gmail.com",
            navigation: {
                home: "Home",
                about: "About Nora",
                books: "Books",
                benefits: "Recipes",
                blog: "Blogs",
                contact: "Connect"
            }
        };
        saveSettings(defaultSettings);
        res.redirect('/settings?success=Settings reset to defaults');
    } catch (error) {
        console.error('Reset settings error:', error);
        res.redirect('/settings?error=Failed to reset settings');
    }
});

// Add this after your other data structures and before the messages routes

// ============ MESSAGES DATA MANAGEMENT ============

const messagesDataFile = path.join(__dirname, 'data', 'messages.json');

// Helper functions for messages
const getMessages = () => {
    try {
        return JSON.parse(fs.readFileSync(messagesDataFile, 'utf8'));
    } catch {
        return [];
    }
};

const saveMessages = (messages) => {
    fs.writeFileSync(messagesDataFile, JSON.stringify(messages, null, 2));
};

// ============ MESSAGES ROUTES ============

// GET - List all messages
app.get('/messages', isAuthenticated, (req, res) => {
    const messages = getMessages();
    const unreadCount = messages.filter(m => m.status === 'unread').length;

    res.render('messages', {
        activePage: 'messages',
        viewMode: 'list',
        user: req.session.user,
        messages: messages,
        unreadCount: unreadCount,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// GET - Single message detail
app.get('/messages/:id', isAuthenticated, (req, res) => {
    const messages = getMessages();
    const messageId = parseInt(req.params.id);
    const message = messages.find(m => m.id === messageId);

    if (!message) {
        return res.redirect('/messages?error=Message not found');
    }

    // Mark as read when viewed
    if (message.status === 'unread') {
        message.status = 'read';
        saveMessages(messages);
    }

    res.render('messages', {
        activePage: 'messages',
        viewMode: 'detail',
        user: req.session.user,
        message: message,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Mark message as read/unread
app.post('/messages/toggle-status/:id', isAuthenticated, (req, res) => {
    try {
        const messages = getMessages();
        const messageId = parseInt(req.params.id);
        const message = messages.find(m => m.id === messageId);

        if (!message) {
            return res.redirect('/messages?error=Message not found');
        }

        // Toggle status
        message.status = message.status === 'unread' ? 'read' : 'unread';
        saveMessages(messages);

        res.redirect('/messages/' + messageId + '?success=Message status updated');
    } catch (error) {
        console.error('Toggle status error:', error);
        res.redirect('/messages?error=Failed to update message status');
    }
});

// POST - Delete message
app.post('/messages/delete/:id', isAuthenticated, (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        let messages = getMessages();
        messages = messages.filter(m => m.id !== messageId);
        saveMessages(messages);

        res.redirect('/messages?success=Message deleted successfully');
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/messages?error=Failed to delete message');
    }
});

// POST - Delete all messages (optional)
app.post('/messages/delete-all', isAuthenticated, (req, res) => {
    try {
        saveMessages([]);
        res.redirect('/messages?success=All messages deleted');
    } catch (error) {
        console.error('Delete all error:', error);
        res.redirect('/messages?error=Failed to delete messages');
    }
});

// Subscribers
app.get('/subscribers', isAuthenticated, (req, res) => {
    res.render('subscribers', {
        activePage: 'subscribers',
        user: req.session.user
    });
});

// ============ IMAGES ROUTES ============

// GET images
app.get('/images', isAuthenticated, (req, res) => {
    const images = getImages();
    res.render('images', {
        activePage: 'images',
        user: req.session.user,
        images: images,
        error: req.query.error || null,
        success: req.query.success || null
    });
});

// POST upload - FIXED
app.post('/images/upload', isAuthenticated, (req, res) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            console.error('Upload error:', err);
            if (err.message) {
                return res.redirect('/images?error=' + encodeURIComponent(err.message));
            }
            return res.redirect('/images?error=Upload failed');
        }

        if (!req.file) {
            return res.redirect('/images?error=No file selected');
        }

        try {
            const images = getImages();
            const newImage = {
                id: Date.now().toString(),
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: '/uploads/' + req.file.filename,
                size: req.file.size,
                uploadedAt: new Date().toISOString()
            };

            images.unshift(newImage);
            saveImages(images);

            req.session.save(() => {
                res.redirect('/images?success=Image uploaded successfully');
            });
        } catch (saveError) {
            console.error('Save error:', saveError);
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.redirect('/images?error=Failed to save image');
        }
    });
});

// POST delete - FIXED
app.post('/images/delete/:id', isAuthenticated, (req, res) => {
    try {
        const imageId = req.params.id;
        let images = getImages();
        const imageToDelete = images.find(img => img.id === imageId);

        if (!imageToDelete) {
            return res.redirect('/images?error=Image not found');
        }

        const filePath = path.join(__dirname, 'public', imageToDelete.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        images = images.filter(img => img.id !== imageId);
        saveImages(images);

        req.session.save(() => {
            res.redirect('/images?success=Image deleted successfully');
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/images?error=Failed to delete image');
    }
});

// Helper functions for Books
const getBooksData = () => {
    try {
        return JSON.parse(fs.readFileSync(booksDataFile, 'utf8'));
    } catch {
        return { books: [] };
    }
};

const saveBooksData = (data) => {
    fs.writeFileSync(booksDataFile, JSON.stringify(data, null, 2));
};

// ============ BOOKS ROUTES ============
const booksDataFile = path.join(__dirname, 'data', 'books.json');
// GET - List all books
app.get('/books', isAuthenticated, (req, res) => {
    const data = getBooksData();
    const sortedBooks = [...data.books].sort((a, b) => a.order - b.order);

    res.render('books', {
        activePage: 'books',
        viewMode: 'list',
        books: sortedBooks,
        isEdit: false, // <-- Added to prevent ReferenceError
        book: {},      // <-- Added to prevent ReferenceError
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// GET - New book form
app.get('/books/new', isAuthenticated, (req, res) => {
    res.render('books', {
        activePage: 'books',
        viewMode: 'edit',
        isEdit: false,
        book: {},
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// GET - Edit book form
app.get('/books/edit/:id', isAuthenticated, (req, res) => {
    const data = getBooksData();
    const bookId = parseInt(req.params.id);
    const book = data.books.find(b => b.id === bookId);

    if (!book) {
        return res.redirect('/books?error=Book not found');
    }

    res.render('books', {
        activePage: 'books',
        viewMode: 'edit',
        isEdit: true,
        book: book,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save book (create or update)
app.post('/books/save', isAuthenticated, (req, res) => {
    try {
        const {
            id, title, subtitle, slug, cover_image, description,
            medical_note, buy_buttons, benefits, table_of_contents,
            is_published
        } = req.body;

        const data = getBooksData();

        // Parse JSON fields
        let parsedBuyButtons = [];
        let parsedBenefits = [];
        let parsedTableOfContents = [];

        try {
            parsedBuyButtons = buy_buttons ? JSON.parse(buy_buttons) : [];
        } catch { parsedBuyButtons = []; }

        try {
            parsedBenefits = benefits ? JSON.parse(benefits) : [];
        } catch { parsedBenefits = []; }

        try {
            parsedTableOfContents = table_of_contents ? JSON.parse(table_of_contents) : [];
        } catch { parsedTableOfContents = []; }

        const bookData = {
            title: title || "Untitled Book",
            subtitle: subtitle || "",
            slug: slug ? slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : "",
            cover_image: cover_image || "",
            description: description || "",
            medical_note: medical_note || "",
            buy_buttons: parsedBuyButtons,
            benefits: parsedBenefits,
            table_of_contents: parsedTableOfContents,
            is_published: is_published === 'on'
        };

        if (id) {
            // Update existing book
            const bookId = parseInt(id);
            const index = data.books.findIndex(b => b.id === bookId);
            if (index !== -1) {
                data.books[index] = { ...data.books[index], ...bookData };
            }
        } else {
            // Create new book
            const newId = data.books.length > 0 ? Math.max(...data.books.map(b => b.id)) + 1 : 1;
            const newOrder = data.books.length > 0 ? Math.max(...data.books.map(b => b.order)) + 1 : 1;

            data.books.push({
                id: newId,
                order: newOrder,
                ...bookData,
                createdAt: new Date().toISOString()
            });
        }

        saveBooksData(data);
        res.redirect('/books?success=Book saved successfully');
    } catch (error) {
        console.error('Save book error:', error);
        res.redirect('/books?error=Failed to save book');
    }
});

// POST - Delete book
app.post('/books/delete/:id', isAuthenticated, (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const data = getBooksData();
        data.books = data.books.filter(b => b.id !== bookId);
        saveBooksData(data);
        res.redirect('/books?success=Book deleted successfully');
    } catch (error) {
        console.error('Delete book error:', error);
        res.redirect('/books?error=Failed to delete book');
    }
});

// POST - Move book up
app.post('/books/move-up/:id', isAuthenticated, (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const data = getBooksData();
        const sorted = [...data.books].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(b => b.id === bookId);

        if (index > 0) {
            const tempOrder = sorted[index].order;
            sorted[index].order = sorted[index - 1].order;
            sorted[index - 1].order = tempOrder;
            saveBooksData(data);
        }

        res.redirect('/books?success=Book moved up');
    } catch (error) {
        console.error('Move up error:', error);
        res.redirect('/books?error=Failed to move book');
    }
});

// POST - Move book down
app.post('/books/move-down/:id', isAuthenticated, (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const data = getBooksData();
        const sorted = [...data.books].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(b => b.id === bookId);

        if (index !== -1 && index < sorted.length - 1) {
            const tempOrder = sorted[index].order;
            sorted[index].order = sorted[index + 1].order;
            sorted[index + 1].order = tempOrder;
            saveBooksData(data);
        }

        res.redirect('/books?success=Book moved down');
    } catch (error) {
        console.error('Move down error:', error);
        res.redirect('/books?error=Failed to move book');
    }
});

// POST - Toggle book visibility
app.post('/books/toggle-visibility/:id', isAuthenticated, (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const data = getBooksData();
        const book = data.books.find(b => b.id === bookId);

        if (book) {
            book.is_published = !book.is_published;
            saveBooksData(data);
            res.redirect('/books?success=Book visibility updated');
        } else {
            res.redirect('/books?error=Book not found');
        }
    } catch (error) {
        console.error('Toggle visibility error:', error);
        res.redirect('/books?error=Failed to update visibility');
    }
});

// ARC Readers
const arcReadersDataFile = path.join(__dirname, 'data', 'arc-readers.json');
// Helper functions for ARC Readers
const getArcData = () => {
    try {
        return JSON.parse(fs.readFileSync(arcReadersDataFile, 'utf8'));
    } catch {
        return {};
    }
};

const saveArcData = (data) => {
    fs.writeFileSync(arcReadersDataFile, JSON.stringify(data, null, 2));
};

// ============ ARC READERS ROUTES ============

// GET - Display ARC Readers page
app.get('/arc-readers', isAuthenticated, (req, res) => {
    const data = getArcData();
    res.render('arc-readers', {
        activePage: 'arc-readers',
        user: req.session.user,
        data: data,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save ARC Readers content
app.post('/arc-readers/save', isAuthenticated, (req, res) => {
    try {
        const { title, message, howItWorks } = req.body;

        const data = {
            title: title || "<h1>Be the first to read Nora's new book</h1>",
            message: message || "",
            howItWorks: howItWorks || ""
        };

        saveArcData(data);
        res.redirect('/arc-readers?success=ARC Readers page saved successfully');
    } catch (error) {
        console.error('Save ARC error:', error);
        res.redirect('/arc-readers?error=Failed to save ARC Readers page');
    }
});

// Bonus Recipes
const bonusRecipesDataFile = path.join(__dirname, 'data', 'bonus-recipes.json');
const getBonusData = () => {
    try {
        return JSON.parse(fs.readFileSync(bonusRecipesDataFile, 'utf8'));
    } catch {
        return {};
    }
};

const saveBonusData = (data) => {
    fs.writeFileSync(bonusRecipesDataFile, JSON.stringify(data, null, 2));
};
// GET - Display Bonus Recipes page
app.get('/bonus-recipes', isAuthenticated, (req, res) => {
    const data = getBonusData();
    res.render('bonus-recipes', {
        activePage: 'bonus-recipes',
        user: req.session.user,
        data: data,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save Bonus Recipes content
app.post('/bonus-recipes/save', isAuthenticated, (req, res) => {
    try {
        const { title, message } = req.body;

        const data = {
            title: title || "<h1>Your Bonus Recipes Collection</h1>",
            message: message || ""
        };

        saveBonusData(data);
        res.redirect('/bonus-recipes?success=Bonus Recipes page saved successfully');
    } catch (error) {
        console.error('Save Bonus error:', error);
        res.redirect('/bonus-recipes?error=Failed to save Bonus Recipes page');
    }
});

// Favorites
const favoritesDataFile = path.join(__dirname, 'data', 'favorites.json');
const getFavoritesData = () => {
    try {
        return JSON.parse(fs.readFileSync(favoritesDataFile, 'utf8'));
    } catch {
        return { pageText: {}, categories: [], products: [] };
    }
};

const saveFavoritesData = (data) => {
    fs.writeFileSync(favoritesDataFile, JSON.stringify(data, null, 2));
};

// ============ FAVORITES ROUTES ============

// GET - Main Favorites page
app.get('/favorites', isAuthenticated, (req, res) => {
    const data = getFavoritesData();
    const sortedProducts = [...data.products].sort((a, b) => a.order - b.order);

    res.render('favorites', {
        activePage: 'favorites',
        viewMode: 'list',
        user: req.session.user,
        favoritesText: data.pageText,
        categories: data.categories,
        products: sortedProducts,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save page text
app.post('/favorites/save-text', isAuthenticated, (req, res) => {
    try {
        const { page_title, intro_paragraph, affiliate_disclosure } = req.body;
        const data = getFavoritesData();

        data.pageText = {
            page_title: page_title || "Nora's Favorites",
            intro_paragraph: intro_paragraph || "",
            affiliate_disclosure: affiliate_disclosure || ""
        };

        saveFavoritesData(data);
        res.redirect('/favorites?success=Page text saved successfully');
    } catch (error) {
        console.error('Save text error:', error);
        res.redirect('/favorites?error=Failed to save page text');
    }
});

// POST - Add category
app.post('/favorites/category/add', isAuthenticated, (req, res) => {
    try {
        const newCat = req.body.category_name ? req.body.category_name.trim() : "";
        if (newCat) {
            const data = getFavoritesData();
            if (!data.categories.includes(newCat)) {
                data.categories.push(newCat);
                saveFavoritesData(data);
                res.redirect('/favorites?success=Category added successfully');
            } else {
                res.redirect('/favorites?error=Category already exists');
            }
        } else {
            res.redirect('/favorites?error=Category name is required');
        }
    } catch (error) {
        console.error('Add category error:', error);
        res.redirect('/favorites?error=Failed to add category');
    }
});

// POST - Delete category
app.post('/favorites/category/delete/:name', isAuthenticated, (req, res) => {
    try {
        const catName = req.params.name;
        const data = getFavoritesData();
        data.categories = data.categories.filter(c => c !== catName);
        saveFavoritesData(data);
        res.redirect('/favorites?success=Category deleted successfully');
    } catch (error) {
        console.error('Delete category error:', error);
        res.redirect('/favorites?error=Failed to delete category');
    }
});

// GET - New product form
app.get('/favorites/product/new', isAuthenticated, (req, res) => {
    const data = getFavoritesData();
    res.render('favorites-form', {
        activePage: 'favorites',
        isEdit: false,
        product: {},
        categories: data.categories,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// GET - Edit product form
app.get('/favorites/product/edit/:id', isAuthenticated, (req, res) => {
    const data = getFavoritesData();
    const productId = parseInt(req.params.id);
    const product = data.products.find(p => p.id === productId);

    if (!product) {
        return res.redirect('/favorites?error=Product not found');
    }

    res.render('favorites-form', {
        activePage: 'favorites',
        isEdit: true,
        product: product,
        categories: data.categories,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save product (create or update)
app.post('/favorites/product/save', isAuthenticated, (req, res) => {
    try {
        const { id, title, image_url, category, endorsement, description, buy_url, button_label, is_featured, is_published } = req.body;

        const data = getFavoritesData();
        const productData = {
            title: title || "Untitled Product",
            image_url: image_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300",
            category: category || data.categories[0] || "",
            endorsement: endorsement || "",
            description: description || "",
            buy_url: buy_url || "",
            button_label: button_label || "View on Amazon",
            is_featured: is_featured === 'on',
            is_published: is_published === 'on'
        };

        if (id) {
            // Update existing product
            const productId = parseInt(id);
            const index = data.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                data.products[index] = { ...data.products[index], ...productData };
            }
        } else {
            // Create new product
            const newId = data.products.length > 0 ? Math.max(...data.products.map(p => p.id)) + 1 : 1;
            const newOrder = data.products.length > 0 ? Math.max(...data.products.map(p => p.order)) + 1 : 1;

            data.products.push({
                id: newId,
                order: newOrder,
                ...productData
            });
        }

        saveFavoritesData(data);
        res.redirect('/favorites?success=Product saved successfully');
    } catch (error) {
        console.error('Save product error:', error);
        res.redirect('/favorites?error=Failed to save product');
    }
});

// POST - Delete product
app.post('/favorites/product/delete/:id', isAuthenticated, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const data = getFavoritesData();
        data.products = data.products.filter(p => p.id !== productId);
        saveFavoritesData(data);
        res.redirect('/favorites?success=Product deleted successfully');
    } catch (error) {
        console.error('Delete product error:', error);
        res.redirect('/favorites?error=Failed to delete product');
    }
});

// POST - Move product up
app.post('/favorites/product/move-up/:id', isAuthenticated, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const data = getFavoritesData();
        const sorted = [...data.products].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(p => p.id === productId);

        if (index > 0) {
            const tempOrder = sorted[index].order;
            sorted[index].order = sorted[index - 1].order;
            sorted[index - 1].order = tempOrder;
            saveFavoritesData(data);
        }

        res.redirect('/favorites?success=Product moved up');
    } catch (error) {
        console.error('Move up error:', error);
        res.redirect('/favorites?error=Failed to move product');
    }
});

// POST - Move product down
app.post('/favorites/product/move-down/:id', isAuthenticated, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const data = getFavoritesData();
        const sorted = [...data.products].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(p => p.id === productId);

        if (index !== -1 && index < sorted.length - 1) {
            const tempOrder = sorted[index].order;
            sorted[index].order = sorted[index + 1].order;
            sorted[index + 1].order = tempOrder;
            saveFavoritesData(data);
        }

        res.redirect('/favorites?success=Product moved down');
    } catch (error) {
        console.error('Move down error:', error);
        res.redirect('/favorites?error=Failed to move product');
    }
});

// Contact Page
const contactDataFile = path.join(__dirname, 'data', 'contact.json');
const getContactData = () => {
    try {
        return JSON.parse(fs.readFileSync(contactDataFile, 'utf8'));
    } catch {
        return { faqs: [] };
    }
};

const saveContactData = (data) => {
    fs.writeFileSync(contactDataFile, JSON.stringify(data, null, 2));
};

// ============ CONTACT PAGE ROUTES ============

// GET - Contact page
app.get('/contact-page', isAuthenticated, (req, res) => {
    const data = getContactData();
    const images = getImages(); // Get images from images.json

    res.render('contact-page', {
        activePage: 'contact-page',
        user: req.session.user,
        data: data,
        images: images,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save Contact page
app.post('/contact-page/save', isAuthenticated, (req, res) => {
    try {
        const { page_title, intro_paragraph, lets_connect_note, photo_strip, faq } = req.body;

        // Process FAQs
        let formattedFaqs = [];
        if (faq && typeof faq === 'object') {
            formattedFaqs = Object.values(faq)
                .filter(item => item.question || item.answer)
                .map((item, index) => ({
                    id: Date.now() + index,
                    question: item.question || "",
                    answer: item.answer || ""
                }));
        }

        // Process photo strip (selected image paths)
        let photoStrip = [];
        if (photo_strip) {
            photoStrip = Array.isArray(photo_strip) ? photo_strip : [photo_strip];
            photoStrip = photoStrip.filter(url => url && url.trim() !== '');
        }

        const data = {
            page_title: page_title || "Contact Nora",
            intro_paragraph: intro_paragraph || "",
            lets_connect_note: lets_connect_note || "",
            photo_strip: photoStrip,
            faqs: formattedFaqs
        };

        saveContactData(data);
        res.redirect('/contact-page?success=Contact page saved successfully');
    } catch (error) {
        console.error('Save contact error:', error);
        res.redirect('/contact-page?error=Failed to save contact page');
    }
});

// POST - Move FAQ up
app.post('/contact-page/faq/move-up/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = getContactData();
        const index = data.faqs.findIndex(f => f.id === faqId);

        if (index > 0) {
            const temp = data.faqs[index];
            data.faqs[index] = data.faqs[index - 1];
            data.faqs[index - 1] = temp;
            saveContactData(data);
        }

        res.redirect('/contact-page?success=FAQ moved up');
    } catch (error) {
        console.error('Move up error:', error);
        res.redirect('/contact-page?error=Failed to move FAQ');
    }
});

// POST - Move FAQ down
app.post('/contact-page/faq/move-down/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = getContactData();
        const index = data.faqs.findIndex(f => f.id === faqId);

        if (index !== -1 && index < data.faqs.length - 1) {
            const temp = data.faqs[index];
            data.faqs[index] = data.faqs[index + 1];
            data.faqs[index + 1] = temp;
            saveContactData(data);
        }

        res.redirect('/contact-page?success=FAQ moved down');
    } catch (error) {
        console.error('Move down error:', error);
        res.redirect('/contact-page?error=Failed to move FAQ');
    }
});

// POST - Delete FAQ
app.post('/contact-page/faq/delete/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = getContactData();
        data.faqs = data.faqs.filter(f => f.id !== faqId);
        saveContactData(data);
        res.redirect('/contact-page?success=FAQ deleted');
    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.redirect('/contact-page?error=Failed to delete FAQ');
    }
});

// Blog Posts
let blogPosts = [
    {
        id: 1,
        title: "How to safely store your organic castor oil packs",
        slug: "storing-castor-oil-packs",
        description: "Proper storage is essential...",
        is_published: true
    }
];

const getBlogData = () => {
    try {
        return JSON.parse(fs.readFileSync(blogPostsDataFile, 'utf8'));
    } catch {
        return { page_heading: "Latest Articles", posts: [] };
    }
};

const saveBlogData = (data) => {
    fs.writeFileSync(blogPostsDataFile, JSON.stringify(data, null, 2));
};

// ============ BLOG POSTS ROUTES ============

// GET - List all blog posts
app.get('/blog-posts', isAuthenticated, (req, res) => {
    const data = getBlogData();
    const sortedPosts = [...data.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render('blog-posts', {
        activePage: 'blog-posts',
        viewMode: 'list',
        posts: sortedPosts,
        pageHeading: data.page_heading,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// GET - New post form
app.get('/blog-posts/new', isAuthenticated, (req, res) => {
    const data = getBlogData();
    res.render('blog-posts', {
        activePage: 'blog-posts',
        viewMode: 'edit',
        isEdit: false,
        post: {},
        categories: getCategories(),
        pageHeading: data.page_heading,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// GET - Edit post form
app.get('/blog-posts/edit/:id', isAuthenticated, (req, res) => {
    const data = getBlogData();
    const postId = parseInt(req.params.id);
    const post = data.posts.find(p => p.id === postId);

    if (!post) {
        return res.redirect('/blog-posts?error=Post not found');
    }

    res.render('blog-posts', {
        activePage: 'blog-posts',
        viewMode: 'edit',
        isEdit: true,
        post: post,
        categories: getCategories(),
        pageHeading: data.page_heading,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// Helper to get unique categories from posts
const getCategories = () => {
    const data = getBlogData();
    const categories = data.posts.map(p => p.category).filter(Boolean);
    return [...new Set(categories)];
};

// POST - Save blog post (create or update)
const blogPostsDataFile = path.join(__dirname, 'data', 'blog-posts.json');
app.post('/blog-posts/save', isAuthenticated, (req, res) => {
    try {
        const { id, title, slug, category, excerpt, description, read_time, date, is_published, page_heading } = req.body;
        const data = getBlogData();

        // Update page heading if provided
        if (page_heading !== undefined) {
            data.page_heading = page_heading || "Latest Articles";
        }

        const postPayload = {
            title: title || "Untitled Post",
            slug: slug ? slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : "",
            category: category || "Uncategorized",
            excerpt: excerpt || "",
            description: description || "",
            read_time: read_time || "5 min read",
            date: date || new Date().toISOString().split('T')[0],
            is_published: is_published === 'on'
        };

        if (id) {
            // Update existing post
            const postId = parseInt(id);
            const index = data.posts.findIndex(p => p.id === postId);
            if (index !== -1) {
                data.posts[index] = { ...data.posts[index], ...postPayload };
            }
        } else {
            // Create new post
            const newId = data.posts.length > 0 ? Math.max(...data.posts.map(p => p.id)) + 1 : 1;
            data.posts.push({
                id: newId,
                ...postPayload,
                createdAt: new Date().toISOString()
            });
        }

        saveBlogData(data);
        res.redirect('/blog-posts?success=Post saved successfully');
    } catch (error) {
        console.error('Save post error:', error);
        res.redirect('/blog-posts?error=Failed to save post');
    }
});

// POST - Toggle post visibility
app.post('/blog-posts/toggle-visibility/:id', isAuthenticated, (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const data = getBlogData();
        const post = data.posts.find(p => p.id === postId);

        if (post) {
            post.is_published = !post.is_published;
            saveBlogData(data);
            res.redirect('/blog-posts?success=Post visibility updated');
        } else {
            res.redirect('/blog-posts?error=Post not found');
        }
    } catch (error) {
        console.error('Toggle visibility error:', error);
        res.redirect('/blog-posts?error=Failed to update visibility');
    }
});

// POST - Delete post
app.post('/blog-posts/delete/:id', isAuthenticated, (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const data = getBlogData();
        data.posts = data.posts.filter(p => p.id !== postId);
        saveBlogData(data);
        res.redirect('/blog-posts?success=Post deleted successfully');
    } catch (error) {
        console.error('Delete post error:', error);
        res.redirect('/blog-posts?error=Failed to delete post');
    }
});

// POST - Update page heading only
app.post('/blog-posts/update-heading', isAuthenticated, (req, res) => {
    try {
        const { page_heading } = req.body;
        const data = getBlogData();
        data.page_heading = page_heading || "Latest Articles";
        saveBlogData(data);
        res.redirect('/blog-posts?success=Page heading updated');
    } catch (error) {
        console.error('Update heading error:', error);
        res.redirect('/blog-posts?error=Failed to update heading');
    }
});

// Benefits Page
const benefitsDataFile = path.join(__dirname, 'data', 'benefits.json');
const recipesDataFile = path.join(__dirname, 'data', 'recipes.json');
const getRecipesData = () => {
    try {
        return JSON.parse(fs.readFileSync(recipesDataFile, 'utf8'));
    } catch {
        return { recipes: [] };
    }
};

const saveRecipesData = (data) => {
    fs.writeFileSync(recipesDataFile, JSON.stringify(data, null, 2));
};

const getBenefitsData = () => {
    try {
        return JSON.parse(fs.readFileSync(benefitsDataFile, 'utf8'));
    } catch {
        return { faqs: [] };
    }
};

const saveBenefitsData = (data) => {
    fs.writeFileSync(benefitsDataFile, JSON.stringify(data, null, 2));
};

// GET - Benefits page
app.get('/benefits-page', isAuthenticated, (req, res) => {
    const data = getBenefitsData();
    // Get all recipes from the recipes data file
    const recipesData = getRecipesData();

    res.render('benefits-page', {
        activePage: 'benefits-page',
        user: req.session.user,
        data: data,
        recipes: recipesData.recipes || [],
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save Benefits page
app.post('/benefits-page/save', isAuthenticated, (req, res) => {
    try {
        const { page_title, intro_paragraph, recipes, faq } = req.body;

        // Process associated recipes
        let associatedRecipes = [];

        if (recipes && typeof recipes === 'object') {
            // Convert recipes object to array if needed
            let recipesArray = Array.isArray(recipes) ? recipes : Object.values(recipes);

            // Filter out empty recipes
            recipesArray = recipesArray.filter(r => r && (r.title || r.ingredients));

            if (recipesArray.length > 0) {
                const recipesData = getRecipesData();

                recipesArray.forEach((recipeData) => {
                    if (recipeData.id && recipeData.id !== '0' && recipeData.id !== 0) {
                        // Update existing recipe
                        const existingIndex = recipesData.recipes.findIndex(r => r.id === parseInt(recipeData.id));
                        if (existingIndex !== -1) {
                            recipesData.recipes[existingIndex] = {
                                id: parseInt(recipeData.id),
                                title: recipeData.title || "Untitled Recipe",
                                ingredients: recipeData.ingredients || "",
                                instructions: recipeData.instructions || "",
                                howToUse: recipeData.howToUse || "",
                                frequency: recipeData.frequency || "",
                                shelfLife: recipeData.shelfLife || ""
                            };
                            associatedRecipes.push(parseInt(recipeData.id));
                        }
                    } else {
                        // Create new recipe
                        const newId = recipesData.recipes.length > 0 ?
                            Math.max(...recipesData.recipes.map(r => r.id)) + 1 : 1;

                        const newRecipe = {
                            id: newId,
                            title: recipeData.title || `Recipe ${newId}`,
                            ingredients: recipeData.ingredients || "",
                            instructions: recipeData.instructions || "",
                            howToUse: recipeData.howToUse || "",
                            frequency: recipeData.frequency || "",
                            shelfLife: recipeData.shelfLife || ""
                        };

                        recipesData.recipes.push(newRecipe);
                        associatedRecipes.push(newId);
                    }
                });

                saveRecipesData(recipesData);
            }
        }

        // Process FAQs
        let formattedFaqs = [];
        if (faq && typeof faq === 'object') {
            const faqArray = Array.isArray(faq) ? faq : Object.values(faq);
            formattedFaqs = faqArray
                .filter(item => item && (item.question || item.answer))
                .map((item, index) => ({
                    id: Date.now() + index,
                    question: item.question || "",
                    answer: item.answer || ""
                }));
        }

        const data = {
            page_title: page_title || "Castor Oil Benefits & Uses",
            intro_paragraph: intro_paragraph || "",
            associated_recipes: associatedRecipes,
            faqs: formattedFaqs
        };

        saveBenefitsData(data);
        res.redirect('/benefits-page?success=Benefits page saved successfully');
    } catch (error) {
        console.error('Save benefits error:', error);
        res.redirect('/benefits-page?error=Failed to save benefits page');
    }
});

// POST - Move FAQ up
app.post('/benefits-page/faq/move-up/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = getBenefitsData();
        const index = data.faqs.findIndex(f => f.id === faqId);

        if (index > 0) {
            const temp = data.faqs[index];
            data.faqs[index] = data.faqs[index - 1];
            data.faqs[index - 1] = temp;
            saveBenefitsData(data);
        }

        res.redirect('/benefits-page?success=FAQ moved up');
    } catch (error) {
        console.error('Move up error:', error);
        res.redirect('/benefits-page?error=Failed to move FAQ');
    }
});
// POST - Delete recipe
// POST - Delete recipe
app.post('/benefits-page/recipe/delete/:id', isAuthenticated, (req, res) => {
    try {
        const recipeId = parseInt(req.params.id);
        // Check if recipe exists before deleting
        const recipesData = getRecipesData();
        const recipeExists = recipesData.recipes.some(r => r.id === recipeId);
        if (!recipeExists) {
            return res.redirect('/benefits-page?error=Recipe not found');
        }

        // Delete from recipes.json
        recipesData.recipes = recipesData.recipes.filter(r => r.id !== recipeId);
        saveRecipesData(recipesData);
        // Remove from associated_recipes in benefits.json
        const benefitsData = getBenefitsData();
        benefitsData.associated_recipes = benefitsData.associated_recipes.filter(id => id !== recipeId);
        saveBenefitsData(benefitsData);
        res.redirect('/benefits-page?success=Recipe deleted successfully');
    } catch (error) {
        console.error('Delete recipe error:', error);
        res.redirect('/benefits-page?error=Failed to delete recipe: ' + error.message);
    }
});
// POST - Move FAQ down
app.post('/benefits-page/faq/move-down/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = getBenefitsData();
        const index = data.faqs.findIndex(f => f.id === faqId);

        if (index !== -1 && index < data.faqs.length - 1) {
            const temp = data.faqs[index];
            data.faqs[index] = data.faqs[index + 1];
            data.faqs[index + 1] = temp;
            saveBenefitsData(data);
        }

        res.redirect('/benefits-page?success=FAQ moved down');
    } catch (error) {
        console.error('Move down error:', error);
        res.redirect('/benefits-page?error=Failed to move FAQ');
    }
});

// POST - Delete FAQ
app.post('/benefits-page/faq/delete/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = getBenefitsData();
        data.faqs = data.faqs.filter(f => f.id !== faqId);
        saveBenefitsData(data);
        res.redirect('/benefits-page?success=FAQ deleted');
    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.redirect('/benefits-page?error=Failed to delete FAQ');
    }
});

// Homepage
// ============ HOMEPAGE DATA MANAGEMENT ============

const homepageDataFile = path.join(__dirname, 'data', 'homepage.json');

// Helper functions for Homepage
const getHomepageData = () => {
    try {
        return JSON.parse(fs.readFileSync(homepageDataFile, 'utf8'));
    } catch {
        return { book_showcase: {}, author_bio: {}, contact_section: {}, journal_section: {} };
    }
};

const saveHomepageData = (data) => {
    fs.writeFileSync(homepageDataFile, JSON.stringify(data, null, 2));
};

// ============ HOMEPAGE ROUTES ============

// GET - Homepage
app.get('/homepage', isAuthenticated, (req, res) => {
    const data = getHomepageData();
    res.render('homepage', {
        activePage: 'homepage',
        user: req.session.user,
        data: data,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

// POST - Save Homepage
app.post('/homepage/save', isAuthenticated, (req, res) => {
    try {
        const { 
            site_title, 
            about_paragraph,
            book_showcase_title,
            book_showcase_description,
            book_showcase_image,
            author_bio_heading,
            author_bio_text,
            contact_section_title,
            contact_section_description,
            journal_section_title
        } = req.body;
        
        const data = {
            site_title: site_title || "Nora's Living",
            about_paragraph: about_paragraph || "",
            book_showcase: {
                title: book_showcase_title || "",
                description: book_showcase_description || "",
                image: book_showcase_image || ""
            },
            author_bio: {
                heading: author_bio_heading || "About Nora",
                text: author_bio_text || ""
            },
            contact_section: {
                title: contact_section_title || "Let's Connect",
                description: contact_section_description || ""
            },
            journal_section: {
                title: journal_section_title || "From the Journal"
            }
        };
        
        saveHomepageData(data);
        res.redirect('/homepage?success=Homepage saved successfully');
    } catch (error) {
        console.error('Save homepage error:', error);
        res.redirect('/homepage?error=Failed to save homepage');
    }
});

// About Page
let aboutPageData = {
    page_title: "About Nora",
    image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    bio_text: "I'm a researcher and writer focused on clean living.",
    social_links: [
        { label: "Instagram", url: "https://instagram.com/norasliving" },
        { label: "YouTube", url: "https://youtube.com/@norasliving" }
    ]
};

const aboutDataFile = path.join(__dirname, 'data', 'about.json');
const getAboutData = () => {
    try {
        return JSON.parse(fs.readFileSync(aboutDataFile, 'utf8'));
    } catch {
        return { journey_timeline: [], values_pillars: [] };
    }
};

const saveAboutData = (data) => {
    fs.writeFileSync(aboutDataFile, JSON.stringify(data, null, 2));
};

// ============ ABOUT PAGE ROUTES ============
app.get('/about-page', isAuthenticated, (req, res) => {
    try {
        const data = getAboutData();
        res.render('about-page', {
            activePage: 'about-page',
            user: req.session.user,
            data: data,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error('GET About error:', error);
        res.render('about-page', {
            activePage: 'about-page',
            user: req.session.user,
            data: { journey_timeline: [], values_pillars: [] },
            error: 'Failed to load about page data'
        });
    }
});

app.post('/about-page/save', isAuthenticated, (req, res) => {
    try {
        const { page_title, page_subtitle, photo, bio_text, journey, values } = req.body;
        let formattedJourney = [];
        if (journey) {
            let journeyArray;

            if (Array.isArray(journey)) {
                journeyArray = journey;
            } else if (typeof journey === 'object') {
                journeyArray = Object.values(journey);
            } else {
                journeyArray = [];
            }
            formattedJourney = journeyArray
                .filter(item => item && (item.year || item.title || item.description))
                .map((item, index) => {
                    return {
                        id: Date.now() + index,
                        year: String(item.year || "").trim(),
                        title: String(item.title || "").trim(),
                        description: String(item.description || "").trim()
                    };
                })
                .filter(item => item.year || item.title || item.description);
        }

        let formattedValues = [];
        if (values) {
            let valuesArray;

            if (Array.isArray(values)) {
                valuesArray = values;
            } else if (typeof values === 'object') {
                valuesArray = Object.values(values);
            } else {
                valuesArray = [];
            }

            formattedValues = valuesArray
                .filter(item => item && (item.name || item.title || item.description))
                .map((item, index) => {
                    return {
                        id: Date.now() + index,
                        name: String(item.name || "").trim(),
                        title: String(item.title || "").trim(),
                        description: String(item.description || "").trim()
                    };
                })
                .filter(item => item.name || item.title || item.description);
        }

        const data = {
            page_title: String(page_title || "About Nora").trim(),
            page_subtitle: String(page_subtitle || "").trim(),
            photo: String(photo || "").trim(),
            bio_text: bio_text || "",
            journey_timeline: formattedJourney,
            values_pillars: formattedValues
        };

        // Save the data
        saveAboutData(data);
        // Redirect with success message
        res.redirect('/about-page?success=About page saved successfully');
    } catch (error) {
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        // Redirect with error message
        const errorMessage = encodeURIComponent('Failed to save about page: ' + error.message);
        res.redirect('/about-page?error=' + errorMessage);
    }
});

app.post('/about-page/journey/delete/:id', isAuthenticated, (req, res) => {
    try {
        const journeyId = parseInt(req.params.id);
        const data = getAboutData();
        data.journey_timeline = data.journey_timeline.filter(j => j.id !== journeyId);
        saveAboutData(data);
        res.redirect('/about-page?success=Journey item deleted');
    } catch (error) {
        console.error('Delete journey error:', error);
        res.redirect('/about-page?error=Failed to delete journey item');
    }
});

app.post('/about-page/values/delete/:id', isAuthenticated, (req, res) => {
    try {
        const valueId = parseInt(req.params.id);
        const data = getAboutData();
        data.values_pillars = data.values_pillars.filter(v => v.id !== valueId);
        saveAboutData(data);
        res.redirect('/about-page?success=Values pillar deleted');
    } catch (error) {
        console.error('Delete values error:', error);
        res.redirect('/about-page?error=Failed to delete values pillar');
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Admin panel running at http://localhost:${PORT}`);
    console.log(`Login with: admin@example.com / admin123`);
});