const express = require('express');
const router = express.Router();

const Puppy = require('../models/Puppy');
const Litter = require('../models/Litter');
const Inquiry = require('../models/Inquiry');
const Testimonial = require('../models/Testimonial');
const BlogPost = require('../models/BlogPost');
const { sendEmail, newInquiryEmail } = require('../utils/email');

router.get('/', async (req, res) => {
  const [featured, testimonials, litters] = await Promise.all([
    Puppy.find({ status: 'available' }).sort({ featured: -1, createdAt: -1 }).limit(3),
    Testimonial.find({ approved: true }).sort({ createdAt: -1 }).limit(4),
    Litter.find({ status: { $in: ['expected', 'born', 'weaning'] } }).sort({ createdAt: -1 }).limit(2),
  ]);
  res.render('index', { title: 'Home', featured, testimonials, litters });
});

router.get('/available-puppies', async (req, res) => {
  const filter = {};
  if (req.query.sex) filter.sex = req.query.sex;
  if (req.query.color) filter.color = req.query.color;
  if (req.query.status) filter.status = req.query.status;
  else filter.status = { $in: ['available', 'reserved'] };

  const puppies = await Puppy.find(filter).sort({ createdAt: -1 });
  res.render('puppies', { title: 'Available Puppies', puppies, query: req.query });
});

router.get('/puppies/:id', async (req, res) => {
  const puppy = await Puppy.findById(req.params.id).populate('litter');
  if (!puppy) return res.status(404).render('404', { title: 'Not found' });
  res.render('puppy-detail', { title: puppy.name, puppy });
});

router.get('/litters', async (req, res) => {
  const litters = await Litter.find().sort({ createdAt: -1 });
  res.render('litters', { title: 'Litters', litters });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

router.get('/testimonials', async (req, res) => {
  const testimonials = await Testimonial.find({ approved: true }).sort({ createdAt: -1 });
  res.render('testimonials', { title: 'Testimonials', testimonials, submitted: false });
});

router.get('/blog', async (req, res) => {
  const posts = await BlogPost.find({ published: true }).sort({ publishedAt: -1 });
  res.render('blog', { title: 'Care Guides & News', posts });
});

router.get('/blog/:slug', async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, published: true });
  if (!post) return res.status(404).render('404', { title: 'Not found' });
  res.render('blog-detail', { title: post.title, post });
});

router.get('/contact', async (req, res) => {
  let puppyName = '';
  if (req.query.puppy) {
    const p = await Puppy.findById(req.query.puppy).catch(() => null);
    if (p) puppyName = p.name;
  }
  res.render('contact', { title: 'Contact Us', puppyId: req.query.puppy || '', puppyName, success: false, error: null });
});

router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, message, puppy, puppyName } = req.body;
    const inquiry = await Inquiry.create({ name, email, phone, message, puppy: puppy || undefined, puppyName });
    if (process.env.NOTIFY_EMAIL) {
      await sendEmail({
        to: process.env.NOTIFY_EMAIL,
        subject: `New inquiry from ${name}`,
        html: newInquiryEmail(inquiry),
      });
    }
    res.render('contact', { title: 'Contact Us', puppyId: '', puppyName: '', success: true, error: null });
  } catch (err) {
    console.error(err);
    res.render('contact', {
      title: 'Contact Us',
      puppyId: req.body.puppy || '',
      puppyName: req.body.puppyName || '',
      success: false,
      error: 'Something went wrong - please try again or message us directly.',
    });
  }
});

// Public testimonial submission - goes to moderation queue, not shown until approved
router.post('/testimonials', async (req, res) => {
  try {
    const { name, location, rating, message, puppyName } = req.body;
    await Testimonial.create({ name, location, rating, message, puppyName, approved: false });
    const testimonials = await Testimonial.find({ approved: true }).sort({ createdAt: -1 });
    res.render('testimonials', { title: 'Testimonials', testimonials, submitted: true });
  } catch (err) {
    console.error(err);
    res.redirect('/testimonials');
  }
});

module.exports = router;
