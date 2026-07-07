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

// Public directory for static files
app.use(express.static('public'));

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

// Path to data files and directories
const uploadDir = path.join(__dirname, 'public/uploads');
const dataDir = path.join(__dirname, 'data');
const imagesDataFile = path.join(__dirname, 'data', 'images.json');
const blogPostsDataFile = path.join(__dirname, 'data', 'blog-posts.json');
const benefitsDataFile = path.join(__dirname, 'data', 'benefits.json');
const recipesDataFile = path.join(__dirname, 'data', 'recipes.json');
const settingsDataFile = path.join(__dirname, 'data', 'settings.json');
const messagesDataFile = path.join(__dirname, 'data', 'messages.json');
const booksDataFile = path.join(__dirname, 'data', 'books.json');
const arcReadersDataFile = path.join(__dirname, 'data', 'arc-readers.json');
const bonusRecipesDataFile = path.join(__dirname, 'data', 'bonus-recipes.json');
const favoritesDataFile = path.join(__dirname, 'data', 'favorites.json');
const contactDataFile = path.join(__dirname, 'data', 'contact.json');
const homepageDataFile = path.join(__dirname, 'data', 'homepage.json');
const aboutDataFile = path.join(__dirname, 'data', 'about.json');

// Check Data Directories
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Check Data Files
if (!fs.existsSync(imagesDataFile)) {
    fs.writeFileSync(imagesDataFile, JSON.stringify([]));
}
if (!fs.existsSync(blogPostsDataFile)) {
    fs.writeFileSync(blogPostsDataFile, JSON.stringify([]));
}
if (!fs.existsSync(benefitsDataFile)) {
    fs.writeFileSync(benefitsDataFile, JSON.stringify([]));
}
if (!fs.existsSync(recipesDataFile)) {
    fs.writeFileSync(recipesDataFile, JSON.stringify([]));
}
if (!fs.existsSync(settingsDataFile)) {
    fs.writeFileSync(settingsDataFile, JSON.stringify([]));
}
if (!fs.existsSync(messagesDataFile)) {
    fs.writeFileSync(messagesDataFile, JSON.stringify([]));
}
if (!fs.existsSync(booksDataFile)) {
    fs.writeFileSync(booksDataFile, JSON.stringify([]));
}
if (!fs.existsSync(arcReadersDataFile)) {
    fs.writeFileSync(arcReadersDataFile, JSON.stringify([]));
}
if (!fs.existsSync(bonusRecipesDataFile)) {
    fs.writeFileSync(bonusRecipesDataFile, JSON.stringify([]));
}
if (!fs.existsSync(favoritesDataFile)) {
    fs.writeFileSync(favoritesDataFile, JSON.stringify([]));
}
if (!fs.existsSync(contactDataFile)) {
    fs.writeFileSync(contactDataFile, JSON.stringify([]));
}
if (!fs.existsSync(homepageDataFile)) {
    fs.writeFileSync(homepageDataFile, JSON.stringify([]));
}
if (!fs.existsSync(aboutDataFile)) {
    fs.writeFileSync(aboutDataFile, JSON.stringify([]));
}

// Multer upload images to disk
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

const homepageUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, 'public/uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'homepage-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

const readJsonFile = (filePath, fallback) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return fallback;
    }
};

const writeJsonFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

const deleteImageFile = (imagePath) => {
    if (!imagePath) return;
    const filename = path.basename(imagePath);
    const filePath = path.join(__dirname, 'public', imagePath);

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error(`Failed to delete old image: ${err.message}`);
        }
    }
};

const getCategories = () => {
    const data = readJsonFile(blogPostsDataFile, []);
    const categories = data.posts.map(p => p.category).filter(Boolean);
    return [...new Set(categories)];
};

const saveBase64Image = (base64Data) => {
    const matches = base64Data.match(/^data:image\/([A-Za-z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 data');
    }

    const ext = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    const filename = 'about-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext;
    const filePath = path.join(__dirname, 'public/uploads', filename);

    fs.writeFileSync(filePath, data);
    return '/uploads/' + filename;
};

app.get('/admin-books', isAuthenticated, (req, res) => {
    const data = readJsonFile(booksDataFile, []);
    const sortedBooks = [...data.books].sort((a, b) => a.order - b.order);

    res.render('admin/books', {
        activePage: 'books',
        viewMode: 'list',
        books: sortedBooks,
        isEdit: false,
        book: {},
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/books/new', isAuthenticated, (req, res) => {
    res.render('admin/books', {
        activePage: 'books',
        viewMode: 'edit',
        isEdit: false,
        book: {},
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/books/edit/:id', isAuthenticated, (req, res) => {
    const data = readJsonFile(booksDataFile, []);
    const bookId = parseInt(req.params.id);
    const book = data.books.find(b => b.id === bookId);

    if (!book) {
        return res.redirect('/admin-books?error=Book not found');
    }

    res.render('admin/books', {
        activePage: 'books',
        viewMode: 'edit',
        isEdit: true,
        book: book,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/books', (req, res) => {
    try {
        const booksData = readJsonFile(booksDataFile, []);
        const settings = readJsonFile(settingsDataFile, []);
        const publishedBooks = (booksData.books || [])
            .filter(book => book.is_published)
            .sort((a, b) => a.order - b.order);

        res.render('public/public-books', {
            books: publishedBooks,
            settings: settings,
            layout: false
        });
    } catch (error) {
        console.error('Books page error:', error);
        res.status(500).send('Error loading books page');
    }
});

app.get('/books/:slug', (req, res) => {
    try {
        const booksData = readJsonFile(booksDataFile, []);
        const settings = readJsonFile(settingsDataFile, []);
        const book = (booksData.books || []).find(b => b.slug === req.params.slug && b.is_published);

        if (!book) {
            return res.status(404).render('404', { message: 'Book not found' });
        }

        const formattedBook = {
            ...book,
            benefits: book.benefits || [],
            table_of_contents: book.table_of_contents || []
        };

        res.render('public/public-book-detail', {
            book: formattedBook,
            settings: settings,
            layout: false
        });
    } catch (error) {
        console.error('Book detail error:', error);
        res.status(500).send('Error loading book details');
    }
});

app.get('/', (req, res) => {
    try {
        const homepageData = readJsonFile(homepageDataFile, []);
        const settings = readJsonFile(settingsDataFile, []);
        const aboutData = readJsonFile(aboutDataFile, []);
        const booksData = readJsonFile(booksDataFile, []);
        const blogData = readJsonFile(blogPostsDataFile, []);
        const contactData = readJsonFile(contactDataFile, []);
        const featuredBooks = (booksData.books || [])
            .filter(book => book.is_published && book.is_featured)
            .sort((a, b) => a.order - b.order)
            .slice(0, 3);
        const displayBooks = featuredBooks.length > 0 ? featuredBooks :
            (booksData.books || [])
                .filter(book => book.is_published)
                .sort((a, b) => a.order - b.order)
                .slice(0, 3);
        const recentPosts = (blogData.posts || [])
            .filter(post => post.is_published)
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
            .slice(0, 3)
            .map(post => {
                const date = new Date(post.date || post.createdAt);
                return {
                    ...post,
                    formatted_date: date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })
                };
            });

        res.render('public/public-home', {
            homepageData: homepageData,
            settings: settings,
            aboutData: aboutData,
            books: displayBooks,
            posts: recentPosts,
            contactData: contactData,
            success: req.query.success || null,
            error: req.query.error || null,
            layout: false
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).send('Error loading home page');
    }
});

app.get('/admin', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

app.get('/admin/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('admin/admin-login', {
        error: null,
        title: 'Admin Login'
    });
});

app.get('/subscribers', isAuthenticated, (req, res) => {
    res.render('admin/subscribers', {
        activePage: 'subscribers',
        user: req.session.user
    });
});

app.get('/images', isAuthenticated, (req, res) => {
    const images = readJsonFile(imagesDataFile, []);
    res.render('admin/images', {
        activePage: 'images',
        user: req.session.user,
        images: images,
        error: req.query.error || null,
        success: req.query.success || null
    });
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/admin/login');
    });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard', { activePage: 'dashboard', user: req.session.user });
});

app.get('/messages', isAuthenticated, (req, res) => {
    const messages = readJsonFile(messagesDataFile, []);
    const unreadCount = messages.filter(m => m.status === 'unread').length;

    res.render('admin/messages', {
        activePage: 'messages',
        viewMode: 'list',
        user: req.session.user,
        messages: messages,
        unreadCount: unreadCount,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/messages/:id', isAuthenticated, (req, res) => {
    const messages = readJsonFile(messagesDataFile, []);
    const messageId = parseInt(req.params.id);
    const message = messages.find(m => m.id === messageId);

    if (!message) {
        return res.redirect('/messages?error=Message not found');
    }

    if (message.status === 'unread') {
        message.status = 'read';
        writeJsonFile(messagesDataFile, messages);
    }

    res.render('admin/messages', {
        activePage: 'messages',
        viewMode: 'detail',
        user: req.session.user,
        message: message,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/settings', isAuthenticated, (req, res) => {
    const settings = readJsonFile(settingsDataFile, []);
    res.render('admin/site-settings', {
        activePage: 'settings',
        user: req.session.user,
        settings: settings,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/arcreaders', (req, res) => {
    const data = readJsonFile(arcReadersDataFile, []);
    res.render('public/public-arc-readers', {
        data: data
    });
});

app.get('/bonusrecipes', (req, res) => {
    const data = readJsonFile(bonusRecipesDataFile, []);
    res.render('public/public-bonus-recipes', {
        data: data
    });
});

app.get('/arc-readers', isAuthenticated, (req, res) => {
    const data = readJsonFile(arcReadersDataFile, []);
    res.render('admin/arc-readers', {
        activePage: 'arc-readers',
        user: req.session.user,
        data: data,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/favorites', (req, res) => {
    try {
        const favoritesData = readJsonFile(favoritesDataFile, []);
        const settings = readJsonFile(settingsDataFile, []);
        const categories = favoritesData.categories || [];
        const products = favoritesData.products || [];
        const sortedProducts = [...products].sort((a, b) => a.order - b.order);

        res.render('public/public-favorites', {
            favoritesText: favoritesData.pageText || {},
            categories: categories,
            products: sortedProducts,
            settings: settings,
            layout: false
        });
    } catch (error) {
        console.error('Favorites page error:', error);
        res.status(500).send('Error loading favorites page');
    }
});

app.get('/admin-favorites', isAuthenticated, (req, res) => {
    const data = readJsonFile(favoritesDataFile, []);
    const sortedProducts = [...data.products].sort((a, b) => a.order - b.order);

    res.render('admin/favorites', {
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

app.get('/bonus-recipes', isAuthenticated, (req, res) => {
    const data = readJsonFile(bonusRecipesDataFile, []);
    res.render('admin/bonus-recipes', {
        activePage: 'bonus-recipes',
        user: req.session.user,
        data: data,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/favorites/product/new', isAuthenticated, (req, res) => {
    const data = readJsonFile(favoritesDataFile, []);
    res.render('admin/favorites-form', {
        activePage: 'favorites',
        isEdit: false,
        product: {},
        categories: data.categories,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/favorites/product/edit/:id', isAuthenticated, (req, res) => {
    const data = readJsonFile(favoritesDataFile, []);
    const productId = parseInt(req.params.id);
    const product = data.products.find(p => p.id === productId);

    if (!product) {
        return res.redirect('/admin-favorites?error=Product not found');
    }

    res.render('admin/favorites-form', {
        activePage: 'favorites',
        isEdit: true,
        product: product,
        categories: data.categories,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/contact', (req, res) => {
    try {
        const contactData = readJsonFile(contactDataFile, []);
        const settings = readJsonFile(settingsDataFile, []);
        const homepageData = readJsonFile(homepageDataFile, []);

        res.render('public/public-contact', {
            data: contactData,
            settings: settings,
            homepageData: homepageData,
            success: req.query.success || null,
            error: req.query.error || null,
            layout: false
        });
    } catch (error) {
        console.error('Contact page error:', error);
        res.status(500).send('Error loading contact page');
    }
});

app.get('/contact-page', isAuthenticated, (req, res) => {
    const data = readJsonFile(contactDataFile, []);
    const images = readJsonFile(imagesDataFile, []); // Get images from images.json

    res.render('admin/contact-page', {
        activePage: 'contact-page',
        user: req.session.user,
        data: data,
        images: images,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/blog-posts', isAuthenticated, (req, res) => {
    const data = readJsonFile(blogPostsDataFile, []);
    const sortedPosts = [...data.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render('admin/blog-posts', {
        activePage: 'blog-posts',
        viewMode: 'list',
        posts: sortedPosts,
        pageHeading: data.page_heading,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/blog', (req, res) => {
    try {
        const blogData = readJsonFile(blogPostsDataFile, []);
        const posts = blogData.posts || [];
        const settings = readJsonFile(settingsDataFile, []);

        const formattedPosts = posts.map(post => {
            const date = new Date(post.date || post.createdAt);
            return {
                ...post,
                formatted_date_short: date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
            };
        });

        const sortedPosts = formattedPosts.sort((a, b) => {
            return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        });

        const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];

        res.render('public/public-blog', {
            posts: sortedPosts,
            categories: categories,
            settings: settings,
            layout: false
        });
    } catch (error) {
        console.error('Blog page error:', error);
        res.status(500).send('Error loading blog page');
    }
});

app.get('/blog/:slug', (req, res) => {
    try {
        const blogData = readJsonFile(blogPostsDataFile, []);
        const posts = blogData.posts || [];
        const post = posts.find(p => p.slug === req.params.slug && p.is_published);

        if (!post) {
            return res.status(404).render('404', { message: 'Blog post not found' });
        }

        const settings = readJsonFile(settingsDataFile, []);

        const date = new Date(post.date || post.createdAt);
        post.formatted_date = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        res.render('public/public-blog-post', {
            post: post,
            settings: settings,
            layout: false
        });
    } catch (error) {
        console.error('Blog post error:', error);
        res.status(500).send('Error loading blog post');
    }
});

app.get('/blog-posts/new', isAuthenticated, (req, res) => {
    const data = readJsonFile(blogPostsDataFile, []);
    res.render('admin/blog-posts', {
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

app.get('/blog-posts/edit/:id', isAuthenticated, (req, res) => {
    const data = readJsonFile(blogPostsDataFile, []);
    const postId = parseInt(req.params.id);
    const post = data.posts.find(p => p.id === postId);

    if (!post) {
        return res.redirect('/blog-posts?error=Post not found');
    }

    res.render('admin/blog-posts', {
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

app.get('/benefits', (req, res) => {
    try {
        const benefitsData = readJsonFile(benefitsDataFile, []);
        const settings = readJsonFile(settingsDataFile, []);
        const recipesData = readJsonFile(recipesDataFile, []);
        const allRecipes = recipesData.recipes || [];
        const associatedRecipeIds = benefitsData.associated_recipes || [];
        const associatedRecipes = allRecipes.filter(r => associatedRecipeIds.includes(r.id));

        res.render('public/public-benefits', {
            data: benefitsData,
            recipes: associatedRecipes,
            settings: settings,
            layout: false
        });
    } catch (error) {
        console.error('Benefits page error:', error);
        res.status(500).send('Error loading benefits page');
    }
});

app.get('/homepage', isAuthenticated, (req, res) => {
    const data = readJsonFile(homepageDataFile, []);
    res.render('admin/homepage', {
        activePage: 'homepage',
        user: req.session.user,
        data: data,
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/terms', (req, res) => {
    res.render('public/public-terms', {
        activePage: 'public-terms'
    });
});

app.get('/privacy', (req, res) => {
    res.render('public/public-privacy-policy', {
        activePage: 'public-privacy-policy'
    });
});

app.get('/benefits-page', isAuthenticated, (req, res) => {
    const data = readJsonFile(benefitsDataFile, []);
    const recipesData = readJsonFile(recipesDataFile, []);

    res.render('admin/benefits-page', {
        activePage: 'benefits-page',
        user: req.session.user,
        data: data,
        recipes: recipesData.recipes || [],
        success: req.query.success || null,
        error: req.query.error || null
    });
});

app.get('/about-page', isAuthenticated, (req, res) => {
    try {
        const data = readJsonFile(aboutDataFile, []);
        res.render('admin/about-page', {
            activePage: 'about-page',
            user: req.session.user,
            data: data,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error('GET About error:', error);
        res.render('admin/about-page', {
            activePage: 'about-page',
            user: req.session.user,
            data: { journey_timeline: [], values_pillars: [] },
            error: 'Failed to load about page data'
        });
    }
});

app.get('/about', (req, res) => {
    try {
        const aboutData = readJsonFile(aboutDataFile, []);
        const settings = readJsonFile(settingsDataFile, []);
        const homepageData = readJsonFile(homepageDataFile, []);

        res.render('public/public-about', {
            data: aboutData,
            settings: settings,
            homepageData: homepageData,
            layout: false
        });
    } catch (error) {
        console.error('About page error:', error);
        res.status(500).send('Error loading about page');
    }
});

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
            siteTitle: siteTitle,
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

        writeJsonFile(settingsDataFile, settings);
        res.redirect('/settings?success=Settings saved successfully');
    } catch (error) {
        console.error('Save settings error:', error);
        res.redirect('/settings?error=Failed to save settings');
    }
});

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
        writeJsonFile(settingsDataFile, defaultSettings);
        res.redirect('/settings?success=Settings reset to defaults');
    } catch (error) {
        console.error('Reset settings error:', error);
        res.redirect('/settings?error=Failed to reset settings');
    }
});

app.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const developerEmail = process.env.DEVELOPER_EMAIL;
    const developerPassword = process.env.DEVELOPER_PASSWORD;
    let user = null;

    if (email === adminEmail && password === adminPassword) {
        user = { id: 'admin', email: adminEmail, role: 'admin' };
    } else if (email === developerEmail && password === developerPassword) {
        user = { id: 'developer', email: developerEmail, role: 'developer' };
    }

    if (!user) {
        return res.render('admin/admin-login', {
            error: 'Invalid email or password',
            title: 'Admin Login'
        });
    }

    req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        res.redirect('/dashboard');
    });
});

app.post('/messages/toggle-status/:id', isAuthenticated, (req, res) => {
    try {
        const messages = readJsonFile(messagesDataFile, []);
        const messageId = parseInt(req.params.id);
        const message = messages.find(m => m.id === messageId);

        if (!message) {
            return res.redirect('/messages?error=Message not found');
        }

        // Toggle status
        message.status = message.status === 'unread' ? 'read' : 'unread';
        writeJsonFile(messagesDataFile, messages);

        res.redirect('/messages/' + messageId + '?success=Message status updated');
    } catch (error) {
        console.error('Toggle status error:', error);
        res.redirect('/messages?error=Failed to update message status');
    }
});

app.post('/messages/delete/:id', isAuthenticated, (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        let messages = readJsonFile(messagesDataFile, []);
        messages = messages.filter(m => m.id !== messageId);
        writeJsonFile(messagesDataFile, messages);

        res.redirect('/messages?success=Message deleted successfully');
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/messages?error=Failed to delete message');
    }
});

app.post('/messages/delete-all', isAuthenticated, (req, res) => {
    try {
        writeJsonFile(messagesDataFile, []);
        res.redirect('/messages?success=All messages deleted');
    } catch (error) {
        console.error('Delete all error:', error);
        res.redirect('/messages?error=Failed to delete messages');
    }
});

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
            const images = readJsonFile(imagesDataFile, []);
            const newImage = {
                id: Date.now().toString(),
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: '/uploads/' + req.file.filename,
                size: req.file.size,
                uploadedAt: new Date().toISOString()
            };

            images.unshift(newImage);
            writeJsonFile(imagesDataFile, images);

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

app.post('/images/delete/:id', isAuthenticated, (req, res) => {
    try {
        const imageId = req.params.id;
        let images = readJsonFile(imagesDataFile, []);
        const imageToDelete = images.find(img => img.id === imageId);

        if (!imageToDelete) {
            return res.redirect('/images?error=Image not found');
        }

        const filePath = path.join(__dirname, 'public', imageToDelete.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        images = images.filter(img => img.id !== imageId);
        writeJsonFile(imagesDataFile, images);

        req.session.save(() => {
            res.redirect('/images?success=Image deleted successfully');
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/images?error=Failed to delete image');
    }
});

app.post('/newsletter/subscribe', (req, res) => {
    try {
        const { name, email } = req.body;

        // Here you would integrate with your email marketing service (Kit, Mailchimp, etc.)
        // For now, we'll just log it

        // You would typically send this to your email service provider's API
        // Example with Kit (formerly ConvertKit):
        // const response = await fetch('https://api.kit.com/v3/forms/YOUR_FORM_ID/subscribe', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': 'Bearer YOUR_API_KEY'
        //     },
        //     body: JSON.stringify({
        //         email: email,
        //         first_name: name
        //     })
        // });

        res.redirect('/books?success=Thank you for subscribing!');
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.redirect('/books?error=Failed to subscribe. Please try again.');
    }
});

app.post('/books/save', isAuthenticated, upload.single('cover_image_file'), (req, res) => {
    try {
        const {
            id, title, subtitle, slug, description,
            medical_note, buy_buttons, benefits, table_of_contents,
            is_published, cover_image
        } = req.body;

        const data = readJsonFile(booksDataFile, []);
        const bookId = id ? parseInt(id) : null;
        const oldBook = bookId ? data.books.find(b => b.id === bookId) : null;

        let parsedBuyButtons = [];
        let parsedBenefits = [];
        let parsedTableOfContents = [];

        try { parsedBuyButtons = buy_buttons ? JSON.parse(buy_buttons) : []; } catch { parsedBuyButtons = []; }
        try { parsedBenefits = benefits ? JSON.parse(benefits) : []; } catch { parsedBenefits = []; }
        try { parsedTableOfContents = table_of_contents ? JSON.parse(table_of_contents) : []; } catch { parsedTableOfContents = []; }

        const oldCover = oldBook?.cover_image || '';
        const oldWasLocal = oldCover.startsWith('/uploads/');

        let finalCoverImage = oldCover;

        if (req.file) {
            finalCoverImage = `/uploads/${req.file.filename}`;

            if (oldWasLocal) {
                const oldFileName = path.basename(oldCover);
                const oldFilePath = path.join(uploadDir, oldFileName);

                if (fs.existsSync(oldFilePath)) {
                    try {
                        fs.unlinkSync(oldFilePath);
                    } catch (err) {
                        console.error('Failed to delete old cover image:', err);
                    }
                }
            }
        } else if (cover_image !== undefined) {
            const newCover = cover_image.trim();
            const newIsRemoteUrl = /^https?:\/\//i.test(newCover);

            if (newIsRemoteUrl) {
                finalCoverImage = newCover;

                if (oldWasLocal && oldCover !== newCover) {
                    const oldFileName = path.basename(oldCover);
                    const oldFilePath = path.join(uploadDir, oldFileName);

                    if (fs.existsSync(oldFilePath)) {
                        try {
                            fs.unlinkSync(oldFilePath);
                        } catch (err) {
                            console.error('Failed to delete old cover image:', err);
                        }
                    }
                }
            } else if (newCover) {
                finalCoverImage = newCover;
            }
        }

        const bookData = {
            title: title || "Untitled Book",
            subtitle: subtitle || "",
            slug: slug ? slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : "",
            cover_image: finalCoverImage,
            description: description || "",
            medical_note: medical_note || "",
            buy_buttons: parsedBuyButtons,
            benefits: parsedBenefits,
            table_of_contents: parsedTableOfContents,
            is_published: is_published === 'on'
        };

        if (id) {
            const index = data.books.findIndex(b => b.id === bookId);
            if (index !== -1) {
                data.books[index] = { ...data.books[index], ...bookData };
            }
        } else {
            const newId = data.books.length > 0 ? Math.max(...data.books.map(b => b.id)) + 1 : 1;
            const newOrder = data.books.length > 0 ? Math.max(...data.books.map(b => b.order)) + 1 : 1;

            data.books.push({
                id: newId,
                order: newOrder,
                ...bookData,
                createdAt: new Date().toISOString()
            });
        }

        writeJsonFile(booksDataFile, data);
        res.redirect('/admin-books?success=Book saved successfully');
    } catch (error) {
        console.error('Save book error:', error);
        res.redirect('/admin-books?error=Failed to save book');
    }
});

app.post('/books/delete/:id', isAuthenticated, (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const data = readJsonFile(booksDataFile, []);
        data.books = data.books.filter(b => b.id !== bookId);
        writeJsonFile(booksDataFile, data);
        res.redirect('/admin-books?success=Book deleted successfully');
    } catch (error) {
        console.error('Delete book error:', error);
        res.redirect('/admin-books?error=Failed to delete book');
    }
});

app.post('/books/move-up/:id', isAuthenticated, (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const data = readJsonFile(booksDataFile, []);
        const sorted = [...data.books].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(b => b.id === bookId);

        if (index > 0) {
            const tempOrder = sorted[index].order;
            sorted[index].order = sorted[index - 1].order;
            sorted[index - 1].order = tempOrder;
            writeJsonFile(booksDataFile, data);
        }

        res.redirect('/admin-books?success=Book moved up');
    } catch (error) {
        console.error('Move up error:', error);
        res.redirect('/admin-books?error=Failed to move book');
    }
});

app.post('/books/move-down/:id', isAuthenticated, (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const data = readJsonFile(booksDataFile, []);
        const sorted = [...data.books].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(b => b.id === bookId);

        if (index !== -1 && index < sorted.length - 1) {
            const tempOrder = sorted[index].order;
            sorted[index].order = sorted[index + 1].order;
            sorted[index + 1].order = tempOrder;
            writeJsonFile(booksDataFile, data);
        }

        res.redirect('/admin-books?success=Book moved down');
    } catch (error) {
        console.error('Move down error:', error);
        res.redirect('/admin-books?error=Failed to move book');
    }
});

app.post('/books/toggle-visibility/:id', isAuthenticated, (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const data = readJsonFile(booksDataFile, []);
        const book = data.books.find(b => b.id === bookId);

        if (book) {
            book.is_published = !book.is_published;
            writeJsonFile(booksDataFile, booksDataFile, data);
            res.redirect('/admin-books?success=Book visibility updated');
        } else {
            res.redirect('/admin-books?error=Book not found');
        }
    } catch (error) {
        console.error('Toggle visibility error:', error);
        res.redirect('/admin-books?error=Failed to update visibility');
    }
});

app.post('/arc-readers/save', isAuthenticated, (req, res) => {
    try {
        const { title, message, howItWorks } = req.body;

        const data = {
            title: title,
            message: message || "",
            howItWorks: howItWorks || ""
        };

        writeJsonFile(arcReadersDataFile, data);
        res.redirect('/arc-readers?success=ARC Readers page saved successfully');
    } catch (error) {
        console.error('Save ARC error:', error);
        res.redirect('/arc-readers?error=Failed to save ARC Readers page');
    }
});

app.post('/bonus-recipes/save', isAuthenticated, (req, res) => {
    try {
        const { title, message } = req.body;

        const data = {
            title: title,
            message: message || ""
        };

        writeJsonFile(bonusRecipesDataFile, data);
        res.redirect('/bonus-recipes?success=Bonus Recipes page saved successfully');
    } catch (error) {
        console.error('Save Bonus error:', error);
        res.redirect('/bonus-recipes?error=Failed to save Bonus Recipes page');
    }
});

app.post('/favorites/save-text', isAuthenticated, (req, res) => {
    try {
        const { page_title, intro_paragraph, affiliate_disclosure } = req.body;
        const data = readJsonFile(favoritesDataFile, []);

        data.pageText = {
            page_title: page_title,
            intro_paragraph: intro_paragraph || "",
            affiliate_disclosure: affiliate_disclosure || ""
        };

        writeJsonFile(favoritesDataFile, data);
        res.redirect('/admin-favorites?success=Page text saved successfully');
    } catch (error) {
        console.error('Save text error:', error);
        res.redirect('/admin-favorites?error=Failed to save page text');
    }
});

app.post('/favorites/category/add', isAuthenticated, (req, res) => {
    try {
        const newCat = req.body.category_name ? req.body.category_name.trim() : "";
        if (newCat) {
            const data = readJsonFile(favoritesDataFile, []);
            if (!data.categories.includes(newCat)) {
                data.categories.push(newCat);
                writeJsonFile(favoritesDataFile, data);
                res.redirect('/admin-favorites?success=Category added successfully');
            } else {
                res.redirect('/admin-favorites?error=Category already exists');
            }
        } else {
            res.redirect('/admin-favorites?error=Category name is required');
        }
    } catch (error) {
        console.error('Add category error:', error);
        res.redirect('/admin-favorites?error=Failed to add category');
    }
});

app.post('/favorites/category/delete/:name', isAuthenticated, (req, res) => {
    try {
        const catName = req.params.name;
        const data = readJsonFile(favoritesDataFile, []);
        data.categories = data.categories.filter(c => c !== catName);
        writeJsonFile(favoritesDataFile, data);
        res.redirect('/admin-favorites?success=Category deleted successfully');
    } catch (error) {
        console.error('Delete category error:', error);
        res.redirect('/admin-favorites?error=Failed to delete category');
    }
});

app.post('/favorites/product/save', isAuthenticated, (req, res) => {
    try {
        const { id, title, image_url, category, endorsement, description, buy_url, button_label, is_featured, is_published } = req.body;

        const data = readJsonFile(favoritesDataFile, []);
        const productData = {
            title: title,
            image_url: image_url,
            category: category,
            endorsement: endorsement || "",
            description: description || "",
            buy_url: buy_url || "",
            button_label: button_label,
            is_featured: is_featured === 'on',
            is_published: is_published === 'on'
        };

        if (id) {
            const productId = parseInt(id);
            const index = data.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                data.products[index] = { ...data.products[index], ...productData };
            }
        } else {
            const newId = data.products.length > 0 ? Math.max(...data.products.map(p => p.id)) + 1 : 1;
            const newOrder = data.products.length > 0 ? Math.max(...data.products.map(p => p.order)) + 1 : 1;

            data.products.push({
                id: newId,
                order: newOrder,
                ...productData
            });
        }

        writeJsonFile(favoritesDataFile, data);
        res.redirect('/admin-favorites?success=Product saved successfully');
    } catch (error) {
        console.error('Save product error:', error);
        res.redirect('/admin-favorites?error=Failed to save product');
    }
});

app.post('/favorites/product/delete/:id', isAuthenticated, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const data = readJsonFile(favoritesDataFile, []);
        data.products = data.products.filter(p => p.id !== productId);
        writeJsonFile(favoritesDataFile, data);
        res.redirect('/admin-favorites?success=Product deleted successfully');
    } catch (error) {
        console.error('Delete product error:', error);
        res.redirect('/admin-favorites?error=Failed to delete product');
    }
});

app.post('/favorites/product/move-up/:id', isAuthenticated, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const data = readJsonFile(favoritesDataFile, []);
        const sorted = [...data.products].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(p => p.id === productId);

        if (index > 0) {
            const tempOrder = sorted[index].order;
            sorted[index].order = sorted[index - 1].order;
            sorted[index - 1].order = tempOrder;
            writeJsonFile(favoritesDataFile, data);
        }

        res.redirect('/admin-favorites?success=Product moved up');
    } catch (error) {
        console.error('Move up error:', error);
        res.redirect('/admin-favorites?error=Failed to move product');
    }
});

app.post('/favorites/product/move-down/:id', isAuthenticated, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const data = readJsonFile(favoritesDataFile, []);
        const sorted = [...data.products].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(p => p.id === productId);

        if (index !== -1 && index < sorted.length - 1) {
            const tempOrder = sorted[index].order;
            sorted[index].order = sorted[index + 1].order;
            sorted[index + 1].order = tempOrder;
            writeJsonFile(favoritesDataFile, data);
        }

        res.redirect('/admin-favorites?success=Product moved down');
    } catch (error) {
        console.error('Move down error:', error);
        res.redirect('/admin-favorites?error=Failed to move product');
    }
});

app.post('/contact/submit', (req, res) => {
    try {
        const { name, email, message } = req.body;

        const messages = readJsonFile(messagesDataFile, []);
        const newMessage = {
            id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
            name: name,
            email: email,
            subject: "Contact Form Submission",
            message: message,
            status: "unread",
            createdAt: new Date().toISOString()
        };
        messages.push(newMessage);
        writeJsonFile(messagesDataFile, messages);

        res.redirect('/contact?success=Your message has been sent! I will get back to you soon.');
    } catch (error) {
        console.error('Contact form error:', error);
        res.redirect('/contact?error=Failed to send message. Please try again.');
    }
});

app.post('/contact-page/save', isAuthenticated, (req, res) => {
    try {
        const { page_title, intro_paragraph, lets_connect_note, photo_strip, faq } = req.body;

        let formattedFaqs = [];
        if (faq && typeof faq === 'object') {
            formattedFaqs = Object.values(faq)
                .filter(item => (item.question || '').trim() || (item.answer || '').trim())
                .map(item => ({
                    id: item.id || `faq-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    question: item.question || '',
                    answer: item.answer || ''
                }));
        }

        const photoStrip = photo_strip
            ? (Array.isArray(photo_strip) ? photo_strip : [photo_strip]).filter(url => url && url.trim() !== '')
            : [];

        const data = {
            page_title: page_title,
            intro_paragraph: intro_paragraph || '',
            lets_connect_note: lets_connect_note || '',
            photo_strip: photoStrip,
            faqs: formattedFaqs
        };

        writeJsonFile(contactDataFile, data);
        res.redirect('/contact-page?success=Contact page saved successfully');
    } catch (error) {
        console.error('Save contact error:', error);
        res.redirect('/contact-page?error=Failed to save contact page');
    }
});

app.post('/contact-page/faq/move-up/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = readJsonFile(contactDataFile, []);
        const index = data.faqs.findIndex(f => f.id === faqId);

        if (index > 0) {
            const temp = data.faqs[index];
            data.faqs[index] = data.faqs[index - 1];
            data.faqs[index - 1] = temp;
            writeJsonFile(contactDataFile, data);
        }

        res.redirect('/contact-page?success=FAQ moved up');
    } catch (error) {
        console.error('Move up error:', error);
        res.redirect('/contact-page?error=Failed to move FAQ');
    }
});

app.post('/contact-page/faq/move-down/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = readJsonFile(contactDataFile, []);
        const index = data.faqs.findIndex(f => f.id === faqId);

        if (index !== -1 && index < data.faqs.length - 1) {
            const temp = data.faqs[index];
            data.faqs[index] = data.faqs[index + 1];
            data.faqs[index + 1] = temp;
            writeJsonFile(contactDataFile, data);
        }

        res.redirect('/contact-page?success=FAQ moved down');
    } catch (error) {
        console.error('Move down error:', error);
        res.redirect('/contact-page?error=Failed to move FAQ');
    }
});

app.post('/contact-page/faq/delete/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = readJsonFile(contactDataFile, []);
        data.faqs = data.faqs.filter(f => f.id !== faqId);
        writeJsonFile(contactDataFile, data);
        res.redirect('/contact-page?success=FAQ deleted');
    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.redirect('/contact-page?error=Failed to delete FAQ');
    }
});

app.post('/blog-posts/save', isAuthenticated, (req, res) => {
    try {
        const { id, title, slug, category, excerpt, description, read_time, date, is_published, page_heading } = req.body;
        const data = readJsonFile(blogPostsDataFile, []);

        if (page_heading !== undefined) {
            data.page_heading = page_heading || "Latest Articles";
        }

        const postPayload = {
            title: title,
            slug: slug ? slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : "",
            category: category,
            excerpt: excerpt || "",
            description: description || "",
            read_time: read_time || "5 min",
            date: date || new Date().toISOString().split('T')[0],
            is_published: is_published === 'on'
        };
        if (id) {
            const postId = parseInt(id);
            const index = data.posts.findIndex(p => p.id === postId);
            if (index !== -1) {
                data.posts[index] = { ...data.posts[index], ...postPayload };
            }
        } else {
            const newId = data.posts.length > 0 ? Math.max(...data.posts.map(p => p.id)) + 1 : 1;
            data.posts.push({
                id: newId,
                ...postPayload,
                createdAt: new Date().toISOString()
            });
        }
        writeJsonFile(blogPostsDataFile, data);
        res.redirect('/blog-posts?success=Post saved successfully');
    } catch (error) {
        console.error('Save post error:', error);
        res.redirect('/blog-posts?error=Failed to save post');
    }
});

app.post('/blog-posts/toggle-visibility/:id', isAuthenticated, (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const data = readJsonFile(blogPostsDataFile, []);
        const post = data.posts.find(p => p.id === postId);

        if (post) {
            post.is_published = !post.is_published;
            writeJsonFile(blogPostsDataFile, data);
            res.redirect('/blog-posts?success=Post visibility updated');
        } else {
            res.redirect('/blog-posts?error=Post not found');
        }
    } catch (error) {
        console.error('Toggle visibility error:', error);
        res.redirect('/blog-posts?error=Failed to update visibility');
    }
});

app.post('/blog-posts/delete/:id', isAuthenticated, (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const data = readJsonFile(blogPostsDataFile, []);
        data.posts = data.posts.filter(p => p.id !== postId);
        writeJsonFile(blogPostsDataFile, data);
        res.redirect('/blog-posts?success=Post deleted successfully');
    } catch (error) {
        console.error('Delete post error:', error);
        res.redirect('/blog-posts?error=Failed to delete post');
    }
});

app.post('/blog-posts/update-heading', isAuthenticated, (req, res) => {
    try {
        const { page_heading } = req.body;
        const data = readJsonFile(blogPostsDataFile, []);
        data.page_heading = page_heading;
        writeJsonFile(blogPostsDataFile, data);
        res.redirect('/blog-posts?success=Page heading updated');
    } catch (error) {
        console.error('Update heading error:', error);
        res.redirect('/blog-posts?error=Failed to update heading');
    }
});

app.post('/benefits-page/save', isAuthenticated, (req, res) => {
    try {
        const { page_title, intro_paragraph, recipes, faq } = req.body;
        let associatedRecipes = [];
        if (recipes && typeof recipes === 'object') {
            let recipesArray = Array.isArray(recipes) ? recipes : Object.values(recipes);
            recipesArray = recipesArray.filter(r => r && (r.title || r.ingredients));
            if (recipesArray.length > 0) {
                const recipesData = readJsonFile(recipesDataFile, []);
                recipesArray.forEach((recipeData) => {
                    if (recipeData.id && recipeData.id !== '0' && recipeData.id !== 0) {
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
                writeJsonFile(recipesDataFile, recipesData);
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
            page_title: page_title,
            intro_paragraph: intro_paragraph || "",
            associated_recipes: associatedRecipes,
            faqs: formattedFaqs
        };

        writeJsonFile(benefitsDataFile, data);
        res.redirect('/benefits-page?success=Benefits page saved successfully');
    } catch (error) {
        console.error('Save benefits error:', error);
        res.redirect('/benefits-page?error=Failed to save benefits page');
    }
});

app.post('/benefits-page/faq/move-up/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = readJsonFile(benefitsDataFile, []);
        const index = data.faqs.findIndex(f => f.id === faqId);

        if (index > 0) {
            const temp = data.faqs[index];
            data.faqs[index] = data.faqs[index - 1];
            data.faqs[index - 1] = temp;
            writeJsonFile(benefitsDataFile, data);
        }

        res.redirect('/benefits-page?success=FAQ moved up');
    } catch (error) {
        console.error('Move up error:', error);
        res.redirect('/benefits-page?error=Failed to move FAQ');
    }
});

app.post('/benefits-page/recipe/delete/:id', isAuthenticated, (req, res) => {
    try {
        const recipeId = parseInt(req.params.id);

        const recipesData = readJsonFile(recipesDataFile, []);
        const recipeExists = recipesData.recipes.some(r => r.id === recipeId);
        if (!recipeExists) {
            return res.redirect('/benefits-page?error=Recipe not found');
        }

        recipesData.recipes = recipesData.recipes.filter(r => r.id !== recipeId);
        writeJsonFile(recipesDataFile, recipesData);

        const benefitsData = readJsonFile(benefitsDataFile, []);
        benefitsData.associated_recipes = benefitsData.associated_recipes.filter(id => id !== recipeId);
        writeJsonFile(benefitsDataFile, benefitsData);
        res.redirect('/benefits-page?success=Recipe deleted successfully');
    } catch (error) {
        console.error('Delete recipe error:', error);
        res.redirect('/benefits-page?error=Failed to delete recipe: ' + error.message);
    }
});

app.post('/benefits-page/faq/move-down/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = readJsonFile(benefitsDataFile, []);
        const index = data.faqs.findIndex(f => f.id === faqId);

        if (index !== -1 && index < data.faqs.length - 1) {
            const temp = data.faqs[index];
            data.faqs[index] = data.faqs[index + 1];
            data.faqs[index + 1] = temp;
            writeJsonFile(benefitsDataFile, data);
        }

        res.redirect('/benefits-page?success=FAQ moved down');
    } catch (error) {
        console.error('Move down error:', error);
        res.redirect('/benefits-page?error=Failed to move FAQ');
    }
});

app.post('/benefits-page/faq/delete/:id', isAuthenticated, (req, res) => {
    try {
        const faqId = parseInt(req.params.id);
        const data = readJsonFile(benefitsDataFile, []);
        data.faqs = data.faqs.filter(f => f.id !== faqId);
        writeJsonFile(benefitsDataFile, data);
        res.redirect('/benefits-page?success=FAQ deleted');
    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.redirect('/benefits-page?error=Failed to delete FAQ');
    }
});

app.post('/homepage/save', isAuthenticated, (req, res) => {
    homepageUpload.single('book_showcase_image')(req, res, function (err) {
        try {
            if (err) {
                console.error('Multer error:', err);
                return res.redirect('/homepage?error=' + encodeURIComponent(err.message));
            }

            const {
                site_title,
                about_paragraph,
                book_showcase_title,
                book_showcase_description,
                author_bio_heading,
                author_bio_text,
                contact_section_title,
                contact_section_description,
                journal_section_title
            } = req.body;

            const existingData = readJsonFile(homepageDataFile, []);
            const oldImage = existingData.book_showcase?.image || "";

            let bookShowcaseImage = "";
            const imageUrl = req.body.book_showcase_image_url || "";
            const hasFile = req.file;

            if (hasFile) {
                if (oldImage && oldImage.startsWith('/uploads/')) {
                    deleteImageFile(oldImage);
                }
                bookShowcaseImage = '/uploads/' + req.file.filename;
            } else if (imageUrl && imageUrl.trim() !== '') {
                if (oldImage && oldImage.startsWith('/uploads/')) {
                    deleteImageFile(oldImage);
                }
                bookShowcaseImage = imageUrl.trim();
            } else {
                if (oldImage && oldImage.startsWith('/uploads/')) {
                    deleteImageFile(oldImage);
                    bookShowcaseImage = "";
                } else {
                    bookShowcaseImage = "";
                }
            }

            const data = {
                site_title: site_title,
                about_paragraph: about_paragraph || "",
                book_showcase: {
                    title: book_showcase_title || "",
                    description: book_showcase_description || "",
                    image: bookShowcaseImage
                },
                author_bio: {
                    heading: author_bio_heading,
                    text: author_bio_text || ""
                },
                contact_section: {
                    title: contact_section_title,
                    description: contact_section_description || ""
                },
                journal_section: {
                    title: journal_section_title
                }
            };

            writeJsonFile(homepageDataFile, data);
            res.redirect('/homepage?success=Homepage saved successfully');
        } catch (error) {
            console.error('Save homepage error:', error);
            res.redirect('/homepage?error=' + encodeURIComponent('Failed to save homepage: ' + error.message));
        }
    });
});

app.post('/about-page/save', isAuthenticated, (req, res) => {
    upload.single('photo')(req, res, function (err) {
        try {
            if (err) {
                console.error('Multer error:', err);
                return res.redirect('/about-page?error=' + encodeURIComponent(err.message));
            }

            const { page_title, page_subtitle, bio_text, journey, values, cropped_image, photo_url } = req.body;

            const existingData = readJsonFile(aboutDataFile, []);
            const oldPhoto = existingData.photo || "";

            let photo = "";

            // Check for cropped image data
            if (cropped_image && cropped_image.startsWith('data:image/')) {
                if (oldPhoto && oldPhoto.startsWith('/uploads/')) {
                    deleteImageFile(oldPhoto);
                }
                photo = saveBase64Image(cropped_image);
            } else if (req.file) {
                if (oldPhoto && oldPhoto.startsWith('/uploads/')) {
                    deleteImageFile(oldPhoto);
                }
                photo = '/uploads/' + req.file.filename;
            } else if (photo_url && photo_url.trim() !== '') {
                if (oldPhoto && oldPhoto.startsWith('/uploads/')) {
                    deleteImageFile(oldPhoto);
                }
                photo = photo_url.trim();
            } else {
                if (oldPhoto && oldPhoto.startsWith('/uploads/')) {
                    deleteImageFile(oldPhoto);
                    photo = "";
                } else {
                    photo = "";
                }
            }

            let formattedJourney = [];
            if (journey) {
                let journeyArray = Array.isArray(journey) ? journey : Object.values(journey);
                formattedJourney = journeyArray
                    .filter(item => item && (item.year || item.title || item.description))
                    .map((item, index) => ({
                        id: Date.now() + index,
                        year: String(item.year || "").trim(),
                        title: String(item.title || "").trim(),
                        description: String(item.description || "").trim()
                    }))
                    .filter(item => item.year || item.title || item.description);
            }

            let formattedValues = [];
            if (values) {
                let valuesArray = Array.isArray(values) ? values : Object.values(values);
                formattedValues = valuesArray
                    .filter(item => item && (item.name || item.title || item.description))
                    .map((item, index) => ({
                        id: Date.now() + index,
                        name: String(item.name || "").trim(),
                        title: String(item.title || "").trim(),
                        description: String(item.description || "").trim()
                    }))
                    .filter(item => item.name || item.title || item.description);
            }

            const data = {
                page_title: String(page_title || "About Nora").trim(),
                page_subtitle: String(page_subtitle || "").trim(),
                photo: photo,
                bio_text: bio_text || "",
                journey_timeline: formattedJourney,
                values_pillars: formattedValues
            };

            writeJsonFile(aboutDataFile, data);
            res.redirect('/about-page?success=About page saved successfully');
        } catch (error) {
            console.error('Error details:', error);
            res.redirect('/about-page?error=' + encodeURIComponent('Failed to save about page: ' + error.message));
        }
    });
});

app.post('/about-page/journey/delete/:id', isAuthenticated, (req, res) => {
    try {
        const journeyId = parseInt(req.params.id);
        const data = readJsonFile(aboutDataFile, []);
        data.journey_timeline = data.journey_timeline.filter(j => j.id !== journeyId);
        writeJsonFile(aboutDataFile, data);
        res.redirect('/about-page?success=Journey item deleted');
    } catch (error) {
        console.error('Delete journey error:', error);
        res.redirect('/about-page?error=Failed to delete journey item');
    }
});

app.post('/about-page/values/delete/:id', isAuthenticated, (req, res) => {
    try {
        const valueId = parseInt(req.params.id);
        const data = readJsonFile(aboutDataFile, []);
        data.values_pillars = data.values_pillars.filter(v => v.id !== valueId);
        writeJsonFile(aboutDataFile, data);
        res.redirect('/about-page?success=Values pillar deleted');
    } catch (error) {
        console.error('Delete values error:', error);
        res.redirect('/about-page?error=Failed to delete values pillar');
    }
});

// Start listening
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Admin panel running at http://localhost:${PORT}`);
});