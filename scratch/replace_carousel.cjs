const fs = require('fs');

function replaceCarouselWithGallery(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('ScrollableImageGallery')) {
    content = content.replace(
      /import ImageCarousel from '..\/components\/places\/ImageCarousel';/,
      `import ImageCarousel from '../components/places/ImageCarousel';\nimport ScrollableImageGallery from '../components/places/ScrollableImageGallery';`
    );
  }
  content = content.replace(/<ImageCarousel images=/g, '<ScrollableImageGallery images=');
  fs.writeFileSync(file, content, 'utf8');
}

replaceCarouselWithGallery('src/pages/DailyInfoPage.jsx');
replaceCarouselWithGallery('src/pages/PlaceFeedPage.jsx');
console.log('Replaced successfully');
