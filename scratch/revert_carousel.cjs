const fs = require('fs');

let content = fs.readFileSync('src/pages/PlaceFeedPage.jsx', 'utf8');

if (content.includes("import ImageCarousel from '../components/places/ImageCarousel';")) {
  content = content.replace(/import ScrollableImageGallery from '\.\.\/components\/places\/ScrollableImageGallery';\n?/g, '');
} else {
  content = content.replace(/import ScrollableImageGallery from '\.\.\/components\/places\/ScrollableImageGallery';/g, "import ImageCarousel from '../components/places/ImageCarousel';");
}

content = content.replace(/<ScrollableImageGallery/g, '<ImageCarousel');

fs.writeFileSync('src/pages/PlaceFeedPage.jsx', content, 'utf8');
console.log('Reverted PlaceFeedPage back to ImageCarousel');
