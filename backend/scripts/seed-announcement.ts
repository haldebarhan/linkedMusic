import { PrismaClient, AnnouncementStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Création des annonces d'exemple...");

  // Récupérer les données nécessaires
  const user = await prisma.user.findFirst({
    where: { email: "kehi.franckherve@gmail.com" },
  });

  if (!user) {
    console.error(
      "❌ Utilisateur de test introuvable. Exécutez d'abord le seed principal."
    );
    process.exit(1);
  }

  const categories = await prisma.category.findMany();
  const fields = await prisma.field.findMany({ include: { options: true } });

  const musiciens = categories.find((c) => c.slug === "musiciens");
  const studios = categories.find((c) => c.slug === "studios");
  const producteurs = categories.find((c) => c.slug === "producteurs");
  const beatmakers = categories.find((c) => c.slug === "beatmakers");

  // Récupérer les champs
  const fieldExperience = fields.find((f) => f.key === "experience");
  const fieldInstruments = fields.find((f) => f.key === "instruments");
  const fieldStyles = fields.find((f) => f.key === "styles_musicaux");
  const fieldDisponibilite = fields.find((f) => f.key === "disponibilite");
  const fieldTarifHoraire = fields.find((f) => f.key === "tarif_horaire");
  const fieldLogiciels = fields.find((f) => f.key === "logiciels");
  const fieldPrestation = fields.find((f) => f.key === "type_prestation");
  const fieldEquipement = fields.find((f) => f.key === "equipement");

  // ============================================================================
  // ANNONCE 1: Guitariste professionnel
  // ============================================================================
  console.log("\n🎸 Création d'une annonce de guitariste...");

  const annonce1 = await prisma.announcement.create({
    data: {
      title:
        "Guitariste professionnel disponible pour concerts et enregistrements",
      description:
        "Guitariste avec 10 ans d'expérience, spécialisé en Jazz, Rock et Blues. Disponible pour concerts, enregistrements studio et sessions live. Matériel professionnel (guitares Fender, amplis Marshall). Portfolio disponible avec vidéos de performances.",
      ownerId: user?.id!,
      categoryId: musiciens!.id,
      price: 25000,
      priceUnit: "FCFA/heure",
      negotiable: true,
      location: "Abidjan, Plateau",
      country: "Côte d'Ivoire",
      city: "Abidjan",
      images: [
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1",
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
      ],
      videos: [],
      audios: [],
      status: AnnouncementStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  // Ajouter les valeurs de champs pour l'annonce 1
  if (fieldExperience) {
    await prisma.annFieldValue.create({
      data: {
        announcementId: annonce1.id,
        fieldId: fieldExperience.id,
        valueNumber: 10,
      },
    });
  }

  if (fieldInstruments) {
    const optionGuitare = fieldInstruments.options.find(
      (o) => o.value === "guitare"
    );
    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce1.id,
        fieldId: fieldInstruments.id,
      },
    });
    if (optionGuitare) {
      await prisma.annFieldValueOption.create({
        data: {
          annFieldValueId: fieldValue.id,
          optionId: optionGuitare.id,
        },
      });
    }
  }

  if (fieldStyles) {
    const optionJazz = fieldStyles.options.find((o) => o.value === "jazz");
    const optionRock = fieldStyles.options.find((o) => o.value === "rock");
    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce1.id,
        fieldId: fieldStyles.id,
      },
    });
    if (optionJazz && optionRock) {
      await prisma.annFieldValueOption.createMany({
        data: [
          { annFieldValueId: fieldValue.id, optionId: optionJazz.id },
          { annFieldValueId: fieldValue.id, optionId: optionRock.id },
        ],
      });
    }
  }

  if (fieldDisponibilite) {
    const optionImmediate = fieldDisponibilite.options.find(
      (o) => o.value === "immediate"
    );
    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce1.id,
        fieldId: fieldDisponibilite.id,
      },
    });
    if (optionImmediate) {
      await prisma.annFieldValueOption.create({
        data: {
          annFieldValueId: fieldValue.id,
          optionId: optionImmediate.id,
        },
      });
    }
  }

  if (fieldTarifHoraire) {
    await prisma.annFieldValue.create({
      data: {
        announcementId: annonce1.id,
        fieldId: fieldTarifHoraire.id,
        valueNumber: 25000,
      },
    });
  }

  console.log("✅ Annonce de guitariste créée");

  // ============================================================================
  // ANNONCE 2: Studio d'enregistrement
  // ============================================================================
  console.log("\n🎙️ Création d'une annonce de studio...");

  const annonce2 = await prisma.announcement.create({
    data: {
      title: "Studio d'enregistrement professionnel à Cocody",
      description:
        "Studio moderne équipé pour enregistrement, mixage et mastering. Cabine acoustique, contrôle room spacieuse. Matériel haut de gamme : Neumann U87, Apollo Twin, moniteurs Yamaha HS8. Ingénieur du son inclus. Tarifs compétitifs pour artistes et labels.",
      ownerId: user?.id!!,
      categoryId: studios!.id,
      price: 30000,
      priceUnit: "FCFA/heure",
      negotiable: true,
      location: "Cocody, Riviera Golf",
      country: "Côte d'Ivoire",
      city: "Abidjan",
      images: [
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
        "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7",
      ],
      videos: [],
      audios: [],
      status: AnnouncementStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  if (fieldPrestation) {
    const optionEnregistrement = fieldPrestation.options.find(
      (o) => o.value === "enregistrement"
    );
    const optionMixage = fieldPrestation.options.find(
      (o) => o.value === "mixage"
    );
    const optionMastering = fieldPrestation.options.find(
      (o) => o.value === "mastering"
    );

    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce2.id,
        fieldId: fieldPrestation.id,
      },
    });

    if (optionEnregistrement && optionMixage && optionMastering) {
      await prisma.annFieldValueOption.createMany({
        data: [
          { annFieldValueId: fieldValue.id, optionId: optionEnregistrement.id },
          { annFieldValueId: fieldValue.id, optionId: optionMixage.id },
          { annFieldValueId: fieldValue.id, optionId: optionMastering.id },
        ],
      });
    }
  }

  if (fieldEquipement) {
    await prisma.annFieldValue.create({
      data: {
        announcementId: annonce2.id,
        fieldId: fieldEquipement.id,
        valueText:
          "Microphones: Neumann U87, Shure SM7B, AKG C414\nInterface: Universal Audio Apollo Twin\nMoniteurs: Yamaha HS8\nPréamplis: SSL\nClavier: Native Instruments Komplete Kontrol",
      },
    });
  }

  if (fieldTarifHoraire) {
    await prisma.annFieldValue.create({
      data: {
        announcementId: annonce2.id,
        fieldId: fieldTarifHoraire.id,
        valueNumber: 30000,
      },
    });
  }

  console.log("✅ Annonce de studio créée");

  // ============================================================================
  // ANNONCE 3: Producteur Hip-Hop/Afrobeat
  // ============================================================================
  console.log("\n🎛️ Création d'une annonce de producteur...");

  const annonce3 = await prisma.announcement.create({
    data: {
      title: "Producteur spécialisé Hip-Hop & Afrobeat - Beats personnalisés",
      description:
        "Producteur avec 7 ans d'expérience dans la production Hip-Hop, Trap et Afrobeat. Création de beats sur mesure, production complète d'albums, direction artistique. Collaborations avec plusieurs artistes locaux et internationaux. Beatstore en ligne disponible.",
      ownerId: user?.id!!,
      categoryId: producteurs!.id,
      price: 50000,
      priceUnit: "FCFA/beat",
      negotiable: true,
      location: "Abidjan, Marcory",
      country: "Côte d'Ivoire",
      city: "Abidjan",
      images: [
        "https://images.unsplash.com/photo-1598653222000-6b7b7a552625",
        "https://images.unsplash.com/photo-1571330735066-03aaa9429d89",
      ],
      videos: [],
      audios: [],
      status: AnnouncementStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  if (fieldExperience) {
    await prisma.annFieldValue.create({
      data: {
        announcementId: annonce3.id,
        fieldId: fieldExperience.id,
        valueNumber: 7,
      },
    });
  }

  if (fieldStyles) {
    const optionHipHop = fieldStyles.options.find((o) => o.value === "hip-hop");
    const optionAfrobeat = fieldStyles.options.find(
      (o) => o.value === "afrobeat"
    );

    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce3.id,
        fieldId: fieldStyles.id,
      },
    });

    if (optionHipHop && optionAfrobeat) {
      await prisma.annFieldValueOption.createMany({
        data: [
          { annFieldValueId: fieldValue.id, optionId: optionHipHop.id },
          { annFieldValueId: fieldValue.id, optionId: optionAfrobeat.id },
        ],
      });
    }
  }

  if (fieldLogiciels) {
    const optionFL = fieldLogiciels.options.find(
      (o) => o.value === "fl-studio"
    );
    const optionAbleton = fieldLogiciels.options.find(
      (o) => o.value === "ableton-live"
    );

    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce3.id,
        fieldId: fieldLogiciels.id,
      },
    });

    if (optionFL && optionAbleton) {
      await prisma.annFieldValueOption.createMany({
        data: [
          { annFieldValueId: fieldValue.id, optionId: optionFL.id },
          { annFieldValueId: fieldValue.id, optionId: optionAbleton.id },
        ],
      });
    }
  }

  if (fieldPrestation) {
    const optionProduction = fieldPrestation.options.find(
      (o) => o.value === "production"
    );
    const optionComposition = fieldPrestation.options.find(
      (o) => o.value === "composition"
    );

    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce3.id,
        fieldId: fieldPrestation.id,
      },
    });

    if (optionProduction && optionComposition) {
      await prisma.annFieldValueOption.createMany({
        data: [
          { annFieldValueId: fieldValue.id, optionId: optionProduction.id },
          { annFieldValueId: fieldValue.id, optionId: optionComposition.id },
        ],
      });
    }
  }

  console.log("✅ Annonce de producteur créée");

  // ============================================================================
  // ANNONCE 4: Beatmaker débutant
  // ============================================================================
  console.log("\n🎹 Création d'une annonce de beatmaker...");

  const annonce4 = await prisma.announcement.create({
    data: {
      title: "Beatmaker - Création de beats Trap & Drill",
      description:
        "Jeune beatmaker passionné, spécialisé dans la Trap et la Drill. Beats personnalisés selon vos besoins. Prix abordables pour artistes débutants. Livraison rapide (24-48h). Révisions illimitées jusqu'à satisfaction. SoundCloud et YouTube disponibles pour écouter mes productions.",
      ownerId: user?.id!!,
      categoryId: beatmakers!.id,
      price: 15000,
      priceUnit: "FCFA/beat",
      negotiable: true,
      location: "Abidjan, Yopougon",
      country: "Côte d'Ivoire",
      city: "Abidjan",
      images: ["https://images.unsplash.com/photo-1593784991095-a205069470b6"],
      videos: [],
      audios: [],
      status: AnnouncementStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  if (fieldExperience) {
    await prisma.annFieldValue.create({
      data: {
        announcementId: annonce4.id,
        fieldId: fieldExperience.id,
        valueNumber: 2,
      },
    });
  }

  if (fieldStyles) {
    const optionHipHop = fieldStyles.options.find((o) => o.value === "hip-hop");
    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce4.id,
        fieldId: fieldStyles.id,
      },
    });

    if (optionHipHop) {
      await prisma.annFieldValueOption.create({
        data: {
          annFieldValueId: fieldValue.id,
          optionId: optionHipHop.id,
        },
      });
    }
  }

  if (fieldLogiciels) {
    const optionFL = fieldLogiciels.options.find(
      (o) => o.value === "fl-studio"
    );
    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce4.id,
        fieldId: fieldLogiciels.id,
      },
    });

    if (optionFL) {
      await prisma.annFieldValueOption.create({
        data: {
          annFieldValueId: fieldValue.id,
          optionId: optionFL.id,
        },
      });
    }
  }

  if (fieldDisponibilite) {
    const optionImmediate = fieldDisponibilite.options.find(
      (o) => o.value === "immediate"
    );
    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce4.id,
        fieldId: fieldDisponibilite.id,
      },
    });

    if (optionImmediate) {
      await prisma.annFieldValueOption.create({
        data: {
          annFieldValueId: fieldValue.id,
          optionId: optionImmediate.id,
        },
      });
    }
  }

  console.log("✅ Annonce de beatmaker créée");

  // ============================================================================
  // ANNONCE 5: Pianiste pour événements
  // ============================================================================
  console.log("\n🎹 Création d'une annonce de pianiste...");

  const annonce5 = await prisma.announcement.create({
    data: {
      title: "Pianiste classique disponible pour mariages et événements",
      description:
        "Pianiste diplômée du Conservatoire avec 15 ans d'expérience. Spécialisée en musique classique, jazz et variété française. Disponible pour mariages, cérémonies, cocktails et événements privés. Répertoire varié adaptable à vos souhaits. Piano à queue disponible si besoin.",
      ownerId: user?.id!!,
      categoryId: musiciens!.id,
      price: 50000,
      priceUnit: "FCFA/événement",
      negotiable: true,
      location: "Abidjan, Cocody",
      country: "Côte d'Ivoire",
      city: "Abidjan",
      images: ["https://images.unsplash.com/photo-1520523839897-bd0b52f945a0"],
      videos: [],
      audios: [],
      status: AnnouncementStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  if (fieldExperience) {
    await prisma.annFieldValue.create({
      data: {
        announcementId: annonce5.id,
        fieldId: fieldExperience.id,
        valueNumber: 15,
      },
    });
  }

  if (fieldInstruments) {
    const optionPiano = fieldInstruments.options.find(
      (o) => o.value === "piano"
    );
    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce5.id,
        fieldId: fieldInstruments.id,
      },
    });

    if (optionPiano) {
      await prisma.annFieldValueOption.create({
        data: {
          annFieldValueId: fieldValue.id,
          optionId: optionPiano.id,
        },
      });
    }
  }

  if (fieldStyles) {
    const optionJazz = fieldStyles.options.find((o) => o.value === "jazz");
    const fieldValue = await prisma.annFieldValue.create({
      data: {
        announcementId: annonce5.id,
        fieldId: fieldStyles.id,
      },
    });

    if (optionJazz) {
      await prisma.annFieldValueOption.create({
        data: {
          annFieldValueId: fieldValue.id,
          optionId: optionJazz.id,
        },
      });
    }
  }

  console.log("✅ Annonce de pianiste créée");

  console.log("\n✨ Seed des annonces terminé avec succès !");
  console.log("\n📊 Résumé:");
  console.log("   - 5 annonces créées");
  console.log("   - Toutes les annonces sont publiées");
  console.log("   - Valeurs de champs personnalisés ajoutées");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed des annonces:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
