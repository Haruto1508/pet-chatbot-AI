import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {
  initialUsers,
  initialPets,
  initialArticles,
  initialClinics,
  initialMedicalRecords,
  defaultSystemConfig
} from '../src/data/initialData';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding Users...');
  for (const user of initialUsers) {
    await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      created_at: user.createdAt
    });
  }

  console.log('Seeding Pets...');
  for (const pet of initialPets) {
    await supabase.from('pets').upsert({
      id: pet.id,
      user_id: pet.userId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      gender: pet.gender,
      vaccine_status: pet.vaccineStatus,
      allergies: pet.allergies,
      avatar_url: pet.avatarUrl,
      created_at: pet.createdAt
    });
  }

  console.log('Seeding Clinics...');
  for (const clinic of initialClinics) {
    await supabase.from('clinics').upsert({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      lat: clinic.lat,
      lng: clinic.lng,
      rating: clinic.rating,
      reviews_count: clinic.reviewsCount,
      is_emergency_247: clinic.isEmergency247,
      opening_hours: clinic.openingHours,
      services: clinic.services,
      image_url: clinic.imageUrl
    });
  }

  console.log('Seeding Articles...');
  for (const art of initialArticles) {
    await supabase.from('articles').upsert({
      id: art.id,
      title: art.title,
      species: art.species,
      category: art.category,
      summary: art.summary,
      symptoms: art.symptoms,
      first_aid_steps: art.firstAidSteps,
      doctor_advice: art.doctorAdvice,
      urgency_level: art.urgencyLevel,
      image_url: art.imageUrl,
      content: art.content,
      updated_at: art.updatedAt
    });
  }

  console.log('Seeding Medical Records...');
  for (const rec of initialMedicalRecords) {
    await supabase.from('medical_records').upsert({
      id: rec.id,
      pet_id: rec.petId,
      pet_name: rec.petName,
      pet_species: rec.petSpecies,
      user_id: rec.userId,
      date: rec.date,
      symptom_summary: rec.symptomSummary,
      diagnosis: rec.diagnosis,
      triage_level: rec.triageLevel,
      treatment_plan: rec.treatmentPlan,
      dietary_advice: rec.dietaryAdvice,
      follow_up_notes: rec.followUpNotes,
      chat_snippet: rec.chatSnippet
    });
  }

  console.log('Seeding System Config...');
  await supabase.from('system_config').upsert({
    id: 1,
    ai_model: defaultSystemConfig.aiModel,
    temperature: defaultSystemConfig.temperature,
    system_prompt: defaultSystemConfig.systemPrompt,
    max_tokens: defaultSystemConfig.maxTokens,
    emergency_keywords: defaultSystemConfig.emergencyKeywords
  });

  console.log('Seeding complete!');
}

seed().catch(console.error);
