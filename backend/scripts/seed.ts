import { PrismaClient, FieldInputType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed...");

  // ============================================================================
  // 1. CRÉER LES CATÉGORIES
  // ============================================================================
  console.log("\n📁 Création des catégories...");

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "musiciens" },
      update: {},
      create: {
        name: "Musiciens",
        slug: "musiciens",
        icon: "🎸",
        order: 1,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "studios" },
      update: {},
      create: {
        name: "Studios d'enregistrement",
        slug: "studios",
        icon: "🎙️",
        order: 2,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "producteurs" },
      update: {},
      create: {
        name: "Producteurs",
        slug: "producteurs",
        icon: "🎛️",
        order: 3,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "beatmakers" },
      update: {},
      create: {
        name: "Beatmakers",
        slug: "beatmakers",
        icon: "🎹",
        order: 4,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "ingenieurs-son" },
      update: {},
      create: {
        name: "Ingénieurs du son",
        slug: "ingenieurs-son",
        icon: "🎚️",
        order: 5,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "djs" },
      update: {},
      create: {
        name: "DJs",
        slug: "djs",
        icon: "🎧",
        order: 6,
        active: true,
      },
    }),
  ]);

  console.log(`✅ ${categories.length} catégories créées`);

  // ============================================================================
  // 2. CRÉER LES STYLES MUSICAUX
  // ============================================================================
  console.log("\n🎵 Création des styles musicaux...");

  const musicStyles = await Promise.all([
    // Électronique
    prisma.musicStyle.upsert({
      where: { slug: "house" },
      update: {},
      create: {
        name: "House",
        slug: "house",
        category: "Électronique",
        order: 1,
      },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "techno" },
      update: {},
      create: {
        name: "Techno",
        slug: "techno",
        category: "Électronique",
        order: 2,
      },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "trance" },
      update: {},
      create: {
        name: "Trance",
        slug: "trance",
        category: "Électronique",
        order: 3,
      },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "dubstep" },
      update: {},
      create: {
        name: "Dubstep",
        slug: "dubstep",
        category: "Électronique",
        order: 4,
      },
    }),
    // Africain
    prisma.musicStyle.upsert({
      where: { slug: "afrobeat" },
      update: {},
      create: {
        name: "Afrobeat",
        slug: "afrobeat",
        category: "Africain",
        order: 5,
      },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "coupé-décalé" },
      update: {},
      create: {
        name: "Coupé-Décalé",
        slug: "coupé-décalé",
        category: "Africain",
        order: 6,
      },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "afro-trap" },
      update: {},
      create: {
        name: "Afro-Trap",
        slug: "afro-trap",
        category: "Africain",
        order: 7,
      },
    }),
    // Urban
    prisma.musicStyle.upsert({
      where: { slug: "hip-hop" },
      update: {},
      create: { name: "Hip-Hop", slug: "hip-hop", category: "Urban", order: 8 },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "rap" },
      update: {},
      create: { name: "Rap", slug: "rap", category: "Urban", order: 9 },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "rnb" },
      update: {},
      create: { name: "R&B", slug: "rnb", category: "Urban", order: 10 },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "reggae" },
      update: {},
      create: { name: "Reggae", slug: "reggae", category: "Urban", order: 11 },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "dancehall" },
      update: {},
      create: {
        name: "Dancehall",
        slug: "dancehall",
        category: "Urban",
        order: 12,
      },
    }),
    // Autres
    prisma.musicStyle.upsert({
      where: { slug: "rock" },
      update: {},
      create: { name: "Rock", slug: "rock", category: "Autres", order: 13 },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "jazz" },
      update: {},
      create: { name: "Jazz", slug: "jazz", category: "Autres", order: 14 },
    }),
    prisma.musicStyle.upsert({
      where: { slug: "pop" },
      update: {},
      create: { name: "Pop", slug: "pop", category: "Autres", order: 15 },
    }),
  ]);

  console.log(`✅ ${musicStyles.length} styles musicaux créés`);

  // ============================================================================
  // 3. CRÉER LES INSTRUMENTS
  // ============================================================================
  console.log("\n🎸 Création des instruments...");

  const instruments = await Promise.all([
    // Cordes
    prisma.instrument.upsert({
      where: { slug: "guitare" },
      update: {},
      create: {
        name: "Guitare",
        slug: "guitare",
        category: "Cordes",
        order: 1,
      },
    }),
    prisma.instrument.upsert({
      where: { slug: "basse" },
      update: {},
      create: { name: "Basse", slug: "basse", category: "Cordes", order: 2 },
    }),
    prisma.instrument.upsert({
      where: { slug: "piano" },
      update: {},
      create: { name: "Piano", slug: "piano", category: "Cordes", order: 3 },
    }),
    prisma.instrument.upsert({
      where: { slug: "violon" },
      update: {},
      create: { name: "Violon", slug: "violon", category: "Cordes", order: 4 },
    }),
    // Vents
    prisma.instrument.upsert({
      where: { slug: "saxophone" },
      update: {},
      create: {
        name: "Saxophone",
        slug: "saxophone",
        category: "Vents",
        order: 5,
      },
    }),
    prisma.instrument.upsert({
      where: { slug: "trompette" },
      update: {},
      create: {
        name: "Trompette",
        slug: "trompette",
        category: "Vents",
        order: 6,
      },
    }),
    prisma.instrument.upsert({
      where: { slug: "flute" },
      update: {},
      create: { name: "Flûte", slug: "flute", category: "Vents", order: 7 },
    }),
    // Percussions
    prisma.instrument.upsert({
      where: { slug: "batterie" },
      update: {},
      create: {
        name: "Batterie",
        slug: "batterie",
        category: "Percussions",
        order: 8,
      },
    }),
    prisma.instrument.upsert({
      where: { slug: "djembe" },
      update: {},
      create: {
        name: "Djembé",
        slug: "djembe",
        category: "Percussions",
        order: 9,
      },
    }),
    prisma.instrument.upsert({
      where: { slug: "cajon" },
      update: {},
      create: {
        name: "Cajón",
        slug: "cajon",
        category: "Percussions",
        order: 10,
      },
    }),
  ]);

  console.log(`✅ ${instruments.length} instruments créés`);

  // ============================================================================
  // 4. CRÉER LES LANGUES
  // ============================================================================
  console.log("\n🌍 Création des langues...");

  const languages = await Promise.all([
    prisma.language.upsert({
      where: { code: "fr" },
      update: {},
      create: { name: "Français", code: "fr", order: 1 },
    }),
    prisma.language.upsert({
      where: { code: "en" },
      update: {},
      create: { name: "Anglais", code: "en", order: 2 },
    }),
    prisma.language.upsert({
      where: { code: "es" },
      update: {},
      create: { name: "Espagnol", code: "es", order: 3 },
    }),
    prisma.language.upsert({
      where: { code: "ar" },
      update: {},
      create: { name: "Arabe", code: "ar", order: 4 },
    }),
  ]);

  console.log(`✅ ${languages.length} langues créées`);

  // ============================================================================
  // 5. CRÉER LES LOGICIELS
  // ============================================================================
  console.log("\n💻 Création des logiciels...");

  const softwares = await Promise.all([
    // DAW
    prisma.software.upsert({
      where: { slug: "fl-studio" },
      update: {},
      create: { name: "FL Studio", slug: "fl-studio", type: "DAW", order: 1 },
    }),
    prisma.software.upsert({
      where: { slug: "ableton-live" },
      update: {},
      create: {
        name: "Ableton Live",
        slug: "ableton-live",
        type: "DAW",
        order: 2,
      },
    }),
    prisma.software.upsert({
      where: { slug: "logic-pro" },
      update: {},
      create: { name: "Logic Pro", slug: "logic-pro", type: "DAW", order: 3 },
    }),
    prisma.software.upsert({
      where: { slug: "pro-tools" },
      update: {},
      create: { name: "Pro Tools", slug: "pro-tools", type: "DAW", order: 4 },
    }),
    prisma.software.upsert({
      where: { slug: "cubase" },
      update: {},
      create: { name: "Cubase", slug: "cubase", type: "DAW", order: 5 },
    }),
    // Plugins
    prisma.software.upsert({
      where: { slug: "serum" },
      update: {},
      create: { name: "Serum", slug: "serum", type: "PLUGIN", order: 6 },
    }),
    prisma.software.upsert({
      where: { slug: "omnisphere" },
      update: {},
      create: {
        name: "Omnisphere",
        slug: "omnisphere",
        type: "PLUGIN",
        order: 7,
      },
    }),
    prisma.software.upsert({
      where: { slug: "kontakt" },
      update: {},
      create: { name: "Kontakt", slug: "kontakt", type: "VST", order: 8 },
    }),
  ]);

  console.log(`✅ ${softwares.length} logiciels créés`);

  // ============================================================================
  // 6. CRÉER LES CHAMPS (FIELDS)
  // ============================================================================
  console.log("\n📝 Création des champs...");

  // Champ: Expérience
  const fieldExperience = await prisma.field.upsert({
    where: { key: "experience" },
    update: {},
    create: {
      key: "experience",
      label: "Années d'expérience",
      inputType: FieldInputType.NUMBER,
      placeholder: "Ex: 5",
      helpText: "Nombre d'années d'expérience professionnelle",
      minValue: 0,
      maxValue: 50,
      searchable: true,
      filterable: true,
      sortable: true,
    },
  });

  // Champ: Disponibilité
  const fieldDisponibilite = await prisma.field.upsert({
    where: { key: "disponibilite" },
    update: {},
    create: {
      key: "disponibilite",
      label: "Disponibilité",
      inputType: FieldInputType.SELECT,
      placeholder: "Sélectionnez votre disponibilité",
      searchable: false,
      filterable: true,
      sortable: false,
    },
  });

  await prisma.fieldOption.createMany({
    data: [
      {
        fieldId: fieldDisponibilite.id,
        label: "Immédiate",
        value: "immediate",
        order: 1,
      },
      {
        fieldId: fieldDisponibilite.id,
        label: "Sous 1 semaine",
        value: "1week",
        order: 2,
      },
      {
        fieldId: fieldDisponibilite.id,
        label: "Sous 1 mois",
        value: "1month",
        order: 3,
      },
      {
        fieldId: fieldDisponibilite.id,
        label: "À discuter",
        value: "discuss",
        order: 4,
      },
    ],
    skipDuplicates: true,
  });

  // Champ: Styles musicaux
  const fieldStyles = await prisma.field.upsert({
    where: { key: "styles_musicaux" },
    update: {},
    create: {
      key: "styles_musicaux",
      label: "Styles musicaux",
      inputType: FieldInputType.MULTISELECT,
      placeholder: "Sélectionnez vos styles",
      helpText: "Vous pouvez sélectionner plusieurs styles",
      searchable: true,
      filterable: true,
      sortable: false,
      externalTable: "music_styles",
    },
  });

  await prisma.fieldOption.createMany({
    data: [
      { fieldId: fieldStyles.id, label: "Hip-Hop", value: "hip-hop", order: 1 },
      {
        fieldId: fieldStyles.id,
        label: "Afrobeat",
        value: "afrobeat",
        order: 2,
      },
      { fieldId: fieldStyles.id, label: "Jazz", value: "jazz", order: 3 },
      { fieldId: fieldStyles.id, label: "Rock", value: "rock", order: 4 },
      { fieldId: fieldStyles.id, label: "R&B", value: "rnb", order: 5 },
      { fieldId: fieldStyles.id, label: "Reggae", value: "reggae", order: 6 },
      { fieldId: fieldStyles.id, label: "House", value: "house", order: 7 },
      { fieldId: fieldStyles.id, label: "Techno", value: "techno", order: 8 },
    ],
    skipDuplicates: true,
  });

  // Champ: Instruments
  const fieldInstruments = await prisma.field.upsert({
    where: { key: "instruments" },
    update: {},
    create: {
      key: "instruments",
      label: "Instruments maîtrisés",
      inputType: FieldInputType.MULTISELECT,
      placeholder: "Sélectionnez vos instruments",
      searchable: true,
      filterable: true,
      sortable: false,
      externalTable: "instruments",
    },
  });

  await prisma.fieldOption.createMany({
    data: [
      {
        fieldId: fieldInstruments.id,
        label: "Guitare",
        value: "guitare",
        order: 1,
      },
      {
        fieldId: fieldInstruments.id,
        label: "Piano",
        value: "piano",
        order: 2,
      },
      {
        fieldId: fieldInstruments.id,
        label: "Batterie",
        value: "batterie",
        order: 3,
      },
      {
        fieldId: fieldInstruments.id,
        label: "Basse",
        value: "basse",
        order: 4,
      },
      {
        fieldId: fieldInstruments.id,
        label: "Saxophone",
        value: "saxophone",
        order: 5,
      },
    ],
    skipDuplicates: true,
  });

  // Champ: Tarif horaire
  const fieldTarifHoraire = await prisma.field.upsert({
    where: { key: "tarif_horaire" },
    update: {},
    create: {
      key: "tarif_horaire",
      label: "Tarif horaire (FCFA)",
      inputType: FieldInputType.NUMBER,
      placeholder: "Ex: 15000",
      unit: "FCFA/h",
      minValue: 0,
      searchable: false,
      filterable: true,
      sortable: true,
    },
  });

  // Champ: Portfolio/Site web
  const fieldPortfolio = await prisma.field.upsert({
    where: { key: "portfolio_url" },
    update: {},
    create: {
      key: "portfolio_url",
      label: "Portfolio / Site web",
      inputType: FieldInputType.TEXT,
      placeholder: "https://example.com",
      pattern: "^https?://.*",
      searchable: false,
      filterable: false,
      sortable: false,
    },
  });

  // Champ: Réseaux sociaux
  const fieldReseauxSociaux = await prisma.field.upsert({
    where: { key: "reseaux_sociaux" },
    update: {},
    create: {
      key: "reseaux_sociaux",
      label: "Réseaux sociaux",
      inputType: FieldInputType.TEXT,
      placeholder: "@username",
      searchable: false,
      filterable: false,
      sortable: false,
    },
  });

  // Champ: Diplômes/Certifications
  const fieldDiplomes = await prisma.field.upsert({
    where: { key: "diplomes" },
    update: {},
    create: {
      key: "diplomes",
      label: "Diplômes et certifications",
      inputType: FieldInputType.TEXTAREA,
      placeholder: "Listez vos diplômes...",
      maxLength: 500,
      searchable: false,
      filterable: false,
      sortable: false,
    },
  });

  // Champ: Équipement studio
  const fieldEquipement = await prisma.field.upsert({
    where: { key: "equipement" },
    update: {},
    create: {
      key: "equipement",
      label: "Équipement disponible",
      inputType: FieldInputType.TEXTAREA,
      placeholder: "Décrivez votre équipement...",
      helpText: "Matériel disponible dans votre studio",
      maxLength: 1000,
      searchable: true,
      filterable: false,
      sortable: false,
    },
  });

  // Champ: Logiciels maîtrisés
  const fieldLogiciels = await prisma.field.upsert({
    where: { key: "logiciels" },
    update: {},
    create: {
      key: "logiciels",
      label: "Logiciels maîtrisés",
      inputType: FieldInputType.MULTISELECT,
      placeholder: "Sélectionnez vos logiciels",
      searchable: true,
      filterable: true,
      sortable: false,
      externalTable: "software",
    },
  });

  await prisma.fieldOption.createMany({
    data: [
      {
        fieldId: fieldLogiciels.id,
        label: "FL Studio",
        value: "fl-studio",
        order: 1,
      },
      {
        fieldId: fieldLogiciels.id,
        label: "Ableton Live",
        value: "ableton-live",
        order: 2,
      },
      {
        fieldId: fieldLogiciels.id,
        label: "Logic Pro",
        value: "logic-pro",
        order: 3,
      },
      {
        fieldId: fieldLogiciels.id,
        label: "Pro Tools",
        value: "pro-tools",
        order: 4,
      },
    ],
    skipDuplicates: true,
  });

  // Champ: Type de prestation
  const fieldPrestation = await prisma.field.upsert({
    where: { key: "type_prestation" },
    update: {},
    create: {
      key: "type_prestation",
      label: "Type de prestation",
      inputType: FieldInputType.MULTISELECT,
      placeholder: "Sélectionnez les prestations",
      searchable: true,
      filterable: true,
      sortable: false,
    },
  });

  await prisma.fieldOption.createMany({
    data: [
      {
        fieldId: fieldPrestation.id,
        label: "Enregistrement",
        value: "enregistrement",
        order: 1,
      },
      {
        fieldId: fieldPrestation.id,
        label: "Mixage",
        value: "mixage",
        order: 2,
      },
      {
        fieldId: fieldPrestation.id,
        label: "Mastering",
        value: "mastering",
        order: 3,
      },
      {
        fieldId: fieldPrestation.id,
        label: "Production",
        value: "production",
        order: 4,
      },
      {
        fieldId: fieldPrestation.id,
        label: "Composition",
        value: "composition",
        order: 5,
      },
      {
        fieldId: fieldPrestation.id,
        label: "Arrangement",
        value: "arrangement",
        order: 6,
      },
    ],
    skipDuplicates: true,
  });

  // Champ: Déplacement possible
  const fieldDeplacement = await prisma.field.upsert({
    where: { key: "deplacement" },
    update: {},
    create: {
      key: "deplacement",
      label: "Déplacement possible",
      inputType: FieldInputType.TOGGLE,
      helpText: "Acceptez-vous de vous déplacer ?",
      searchable: false,
      filterable: true,
      sortable: false,
    },
  });

  // Champ: Langues parlées
  const fieldLangues = await prisma.field.upsert({
    where: { key: "langues" },
    update: {},
    create: {
      key: "langues",
      label: "Langues parlées",
      inputType: FieldInputType.MULTISELECT,
      placeholder: "Sélectionnez vos langues",
      searchable: false,
      filterable: true,
      sortable: false,
      externalTable: "languages",
    },
  });

  await prisma.fieldOption.createMany({
    data: [
      { fieldId: fieldLangues.id, label: "Français", value: "fr", order: 1 },
      { fieldId: fieldLangues.id, label: "Anglais", value: "en", order: 2 },
      { fieldId: fieldLangues.id, label: "Espagnol", value: "es", order: 3 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Champs créés avec succès");

  // ============================================================================
  // 7. LIER LES CHAMPS AUX CATÉGORIES
  // ============================================================================
  console.log("\n🔗 Liaison des champs aux catégories...");

  const [musiciens, studios, producteurs, beatmakers, ingenieurs, djs] =
    categories;

  // Musiciens
  await prisma.categoryField.createMany({
    data: [
      {
        categoryId: musiciens.id,
        fieldId: fieldExperience.id,
        required: true,
        order: 1,
      },
      {
        categoryId: musiciens.id,
        fieldId: fieldInstruments.id,
        required: true,
        order: 2,
      },
      {
        categoryId: musiciens.id,
        fieldId: fieldStyles.id,
        required: true,
        order: 3,
      },
      {
        categoryId: musiciens.id,
        fieldId: fieldDisponibilite.id,
        required: false,
        order: 4,
      },
      {
        categoryId: musiciens.id,
        fieldId: fieldTarifHoraire.id,
        required: false,
        order: 5,
      },
      {
        categoryId: musiciens.id,
        fieldId: fieldPortfolio.id,
        required: false,
        order: 6,
      },
      {
        categoryId: musiciens.id,
        fieldId: fieldLangues.id,
        required: false,
        order: 7,
      },
      {
        categoryId: musiciens.id,
        fieldId: fieldDeplacement.id,
        required: false,
        order: 8,
      },
    ],
    skipDuplicates: true,
  });

  // Studios
  await prisma.categoryField.createMany({
    data: [
      {
        categoryId: studios.id,
        fieldId: fieldPrestation.id,
        required: true,
        order: 1,
      },
      {
        categoryId: studios.id,
        fieldId: fieldEquipement.id,
        required: true,
        order: 2,
      },
      {
        categoryId: studios.id,
        fieldId: fieldTarifHoraire.id,
        required: true,
        order: 3,
      },
      {
        categoryId: studios.id,
        fieldId: fieldStyles.id,
        required: false,
        order: 4,
      },
      {
        categoryId: studios.id,
        fieldId: fieldPortfolio.id,
        required: false,
        order: 5,
      },
    ],
    skipDuplicates: true,
  });

  // Producteurs
  await prisma.categoryField.createMany({
    data: [
      {
        categoryId: producteurs.id,
        fieldId: fieldExperience.id,
        required: true,
        order: 1,
      },
      {
        categoryId: producteurs.id,
        fieldId: fieldStyles.id,
        required: true,
        order: 2,
      },
      {
        categoryId: producteurs.id,
        fieldId: fieldLogiciels.id,
        required: true,
        order: 3,
      },
      {
        categoryId: producteurs.id,
        fieldId: fieldPrestation.id,
        required: true,
        order: 4,
      },
      {
        categoryId: producteurs.id,
        fieldId: fieldTarifHoraire.id,
        required: false,
        order: 5,
      },
      {
        categoryId: producteurs.id,
        fieldId: fieldPortfolio.id,
        required: false,
        order: 6,
      },
      {
        categoryId: producteurs.id,
        fieldId: fieldDiplomes.id,
        required: false,
        order: 7,
      },
    ],
    skipDuplicates: true,
  });

  // Beatmakers
  await prisma.categoryField.createMany({
    data: [
      {
        categoryId: beatmakers.id,
        fieldId: fieldExperience.id,
        required: true,
        order: 1,
      },
      {
        categoryId: beatmakers.id,
        fieldId: fieldStyles.id,
        required: true,
        order: 2,
      },
      {
        categoryId: beatmakers.id,
        fieldId: fieldLogiciels.id,
        required: true,
        order: 3,
      },
      {
        categoryId: beatmakers.id,
        fieldId: fieldTarifHoraire.id,
        required: false,
        order: 4,
      },
      {
        categoryId: beatmakers.id,
        fieldId: fieldPortfolio.id,
        required: false,
        order: 5,
      },
      {
        categoryId: beatmakers.id,
        fieldId: fieldDisponibilite.id,
        required: false,
        order: 6,
      },
    ],
    skipDuplicates: true,
  });

  // Ingénieurs du son
  await prisma.categoryField.createMany({
    data: [
      {
        categoryId: ingenieurs.id,
        fieldId: fieldExperience.id,
        required: true,
        order: 1,
      },
      {
        categoryId: ingenieurs.id,
        fieldId: fieldPrestation.id,
        required: true,
        order: 2,
      },
      {
        categoryId: ingenieurs.id,
        fieldId: fieldLogiciels.id,
        required: true,
        order: 3,
      },
      {
        categoryId: ingenieurs.id,
        fieldId: fieldEquipement.id,
        required: false,
        order: 4,
      },
      {
        categoryId: ingenieurs.id,
        fieldId: fieldTarifHoraire.id,
        required: false,
        order: 5,
      },
      {
        categoryId: ingenieurs.id,
        fieldId: fieldDiplomes.id,
        required: false,
        order: 6,
      },
      {
        categoryId: ingenieurs.id,
        fieldId: fieldPortfolio.id,
        required: false,
        order: 7,
      },
    ],
    skipDuplicates: true,
  });

  // DJs
  await prisma.categoryField.createMany({
    data: [
      {
        categoryId: djs.id,
        fieldId: fieldExperience.id,
        required: true,
        order: 1,
      },
      { categoryId: djs.id, fieldId: fieldStyles.id, required: true, order: 2 },
      {
        categoryId: djs.id,
        fieldId: fieldEquipement.id,
        required: false,
        order: 3,
      },
      {
        categoryId: djs.id,
        fieldId: fieldTarifHoraire.id,
        required: false,
        order: 4,
      },
      {
        categoryId: djs.id,
        fieldId: fieldPortfolio.id,
        required: false,
        order: 5,
      },
      {
        categoryId: djs.id,
        fieldId: fieldReseauxSociaux.id,
        required: false,
        order: 6,
      },
      {
        categoryId: djs.id,
        fieldId: fieldDeplacement.id,
        required: false,
        order: 7,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Champs liés aux catégories");

  // ============================================================================
  // 8. CRÉER UN UTILISATEUR DE TEST
  // ============================================================================
  console.log("\n👤 Création d'un utilisateur de test...");

  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      uid: "test-user-001",
      email: "test@example.com",
      displayName: "John Doe",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
      status: "ACTIVATED",
      profileImage: "https://i.pravatar.cc/150?img=12",
      location: "Abidjan, Côte d'Ivoire",
      country: "Côte d'Ivoire",
      city: "Abidjan",
    },
  });

  console.log("✅ Utilisateur de test créé");

  console.log("\n✨ Seed terminé avec succès !");
  console.log("\n📊 Résumé:");
  console.log(`   - ${categories.length} catégories`);
  console.log(`   - ${musicStyles.length} styles musicaux`);
  console.log(`   - ${instruments.length} instruments`);
  console.log(`   - ${languages.length} langues`);
  console.log(`   - ${softwares.length} logiciels`);
  console.log(`   - 14 champs personnalisés`);
  console.log(`   - 1 utilisateur de test`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
