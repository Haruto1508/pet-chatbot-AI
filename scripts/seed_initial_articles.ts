import { initialArticles } from '../src/data/initialData';

async function run() {
  for (const art of initialArticles) {
    const payload = {
      title: art.title,
      species: art.species,
      category: art.category,
      summary: art.summary,
      symptoms: art.symptoms,
      firstAidSteps: art.firstAidSteps,
      doctorAdvice: art.doctorAdvice,
      urgencyLevel: art.urgencyLevel,
      imageUrl: art.imageUrl,
      content: art.content
    };
    try {
      const res = await fetch('http://localhost:3000/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('Added:', data.title);
    } catch (e) {
      console.error(e);
    }
  }
}
run();
