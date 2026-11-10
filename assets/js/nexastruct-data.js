/**
 * NexaStruct services & portfolio content.
 * Representative projects are placeholders — replace with verified project data when available.
 */
var NexaStructData = (function () {
  var SEO_DESCRIPTION =
    "NexaStruct provides architectural design, structural engineering, MEP engineering, CAD/BIM, permit documentation, and construction support for residential, commercial, and industrial projects.";

  var services = [
    {
      id: "01",
      slug: "architectural-design",
      title: "Architectural Design",
      shortDescription:
        "From concept through construction documentation, NexaStruct provides practical architectural solutions for residential, commercial, and renovation projects.",
      image: "assets/images/services/01.jpg",
      icon: "flaticon-expand",
      items: [
        "Residential Design",
        "Commercial Architecture",
        "Building Additions & Remodels",
        "Concept Design",
        "Schematic Design",
        "Design Development",
        "Construction Documents",
        "Permit-Ready Drawing Packages",
        "Code & Accessibility Review",
        "As-Built Drawings",
        "Interior Layout & Space Planning",
      ],
    },
    {
      id: "02",
      slug: "structural-engineering",
      title: "Structural Engineering",
      shortDescription:
        "NexaStruct provides structural analysis and engineering for new construction, renovations, additions, and existing buildings.",
      image: "assets/images/services/02.jpg",
      icon: "flaticon-3d",
      items: [
        "Structural Analysis & Design",
        "Wood Structures",
        "Steel Structures",
        "Concrete Structures",
        "Masonry Structures",
        "Foundation Design",
        "Seismic Design",
        "Framing Plans",
        "Structural Details",
        "Structural Calculations",
        "Structural Inspections",
        "Existing Building Evaluation",
      ],
    },
    {
      id: "03",
      slug: "mep-engineering",
      title: "MEP Engineering",
      shortDescription:
        "Coordinated mechanical, electrical, and plumbing design helps create efficient, buildable, and well-integrated building systems.",
      image: "assets/images/services/03.jpg",
      icon: "flaticon-gear",
      items: [
        "HVAC Design",
        "Mechanical Systems",
        "Electrical Design",
        "Plumbing Design",
        "Lighting Plans",
        "Power Distribution",
        "Equipment Layout",
        "Energy Efficiency",
        "MEP Coordination",
        "Existing-System Evaluation",
      ],
    },
    {
      id: "04",
      slug: "cad-bim",
      title: "CAD & BIM Services",
      shortDescription:
        "Accurate CAD and BIM production supports design development, coordination, documentation, and construction.",
      image: "assets/images/services/04.jpg",
      icon: "flaticon-3d",
      items: [
        "AutoCAD Drafting",
        "Revit Modeling",
        "2D Construction Drawings",
        "3D Building Modeling",
        "BIM Coordination",
        "Architectural Modeling",
        "Structural Modeling",
        "MEP Modeling",
        "Drawing Conversion",
        "As-Built Modeling",
        "Shop Drawing Support",
      ],
    },
    {
      id: "05",
      slug: "permit-construction-documents",
      title: "Permit & Construction Documents",
      shortDescription:
        "Complete, coordinated documentation packages prepared to support permitting and construction.",
      image: "assets/images/services/05.jpg",
      icon: "flaticon-worker",
      items: [
        "Permit Drawing Packages",
        "Site Plans",
        "Floor Plans",
        "Roof Plans",
        "Building Elevations",
        "Building Sections",
        "Construction Details",
        "Structural Sheets",
        "MEP Sheets",
        "Code Documentation",
        "Permit Revision Support",
      ],
    },
    {
      id: "06",
      slug: "residential-design",
      title: "Residential Design",
      shortDescription:
        "Design and engineering solutions for new homes, additions, ADUs, remodels, and residential improvements.",
      image: "assets/images/services/06.jpg",
      icon: "flaticon-expand",
      items: [
        "New Homes",
        "Home Additions",
        "ADUs",
        "Garage Conversions",
        "Remodeling",
        "Kitchen & Bath Remodeling",
        "Porches & Decks",
        "Structural Modifications",
        "Foundation Plans",
        "Permit Packages",
      ],
    },
    {
      id: "07",
      slug: "commercial-industrial",
      title: "Commercial & Industrial",
      shortDescription:
        "Integrated architectural and engineering support for commercial, industrial, manufacturing, warehouse, and tenant-improvement projects.",
      image: "assets/images/services/07.jpg",
      icon: "flaticon-oil",
      items: [
        "Commercial Buildings",
        "Office Improvements",
        "Retail",
        "Restaurants",
        "Industrial Facilities",
        "Manufacturing",
        "Warehouses",
        "Tenant Improvements",
        "Building Expansions",
        "Equipment Foundations",
      ],
    },
    {
      id: "08",
      slug: "construction-support",
      title: "Construction Support",
      shortDescription:
        "NexaStruct supports project teams throughout construction with technical coordination, documentation, revisions, and design support.",
      image: "assets/images/services/08.jpg",
      icon: "flaticon-energy-saving",
      items: [
        "RFI Support",
        "Submittal Review",
        "Drawing Revision Tracking",
        "Construction Coordination",
        "Site Observation",
        "Contractor Coordination",
        "Design Clarifications",
        "Field Verification",
        "As-Built Documentation",
        "Closeout Documentation",
      ],
    },
  ];

  var projects = [
    {
      slug: "residential-addition-remodel",
      title: "Residential Addition & Remodel",
      categories: ["Residential", "Renovation"],
      servicesLabel: "Architectural Design / Structural Engineering / Permit Documents",
      services: ["Architectural Design", "Structural Engineering", "Permit Documents"],
      image: "assets/images/projects/01.jpg",
      gallery: [
        "assets/images/projects/img-1.jpg",
        "assets/images/services/img-1.jpg",
        "assets/images/about-pic.jpg",
        "assets/images/slider/slide-1.jpg",
      ],
      description:
        "Complete architectural and structural design support for a residential addition and remodel, including existing-condition documentation, proposed floor plans, elevations, structural framing, foundation design, and permit-ready construction documents.",
      overview: [
        "This representative example illustrates how NexaStruct coordinates architectural layouts with structural framing and foundation design for a residential addition and interior remodel.",
        "Documentation typically includes existing-condition surveys, proposed plans and elevations, structural details, and a permit-oriented sheet set aligned with local requirements.",
        "Deliverables are structured so contractors and plan reviewers can follow a clear scope from design through construction documentation.",
      ],
      featured: true,
    },
    {
      slug: "custom-residence",
      title: "Custom Residence",
      categories: ["Residential"],
      servicesLabel: "Architecture / Structural Engineering / BIM",
      services: ["Architectural Design", "Structural Engineering", "CAD & BIM"],
      image: "assets/images/projects/02.jpg",
      gallery: [
        "assets/images/slider/slide-1.jpg",
        "assets/images/services/img-1.jpg",
        "assets/images/services/img-2.jpg",
        "assets/images/projects/img-3.jpg",
      ],
      description:
        "Architectural and structural design for a new residential building, including planning, structural framing, foundation design, building sections, elevations, and coordinated construction documentation.",
      overview: [
        "Planning and design development for a new custom residence, with coordinated architectural and structural sheets.",
        "Structural scope includes foundation design, framing layouts, and details suitable for permitting and construction.",
        "BIM or CAD production can support visualization, coordination, and consistent documentation across disciplines.",
      ],
      featured: true,
    },
    {
      slug: "adu-casita",
      title: "ADU / Backyard Casita",
      categories: ["Residential"],
      servicesLabel: "Architectural Design / Structural Engineering / Permit Package",
      services: ["Architectural Design", "Structural Engineering", "Permit Documents"],
      image: "assets/images/projects/03.jpg",
      gallery: [
        "assets/images/services/img-1.jpg",
        "assets/images/projects/img-1.jpg",
        "assets/images/slider/slide-3.jpg",
      ],
      description:
        "Design and engineering support for an accessory dwelling unit, including site planning, floor plans, elevations, foundation design, structural framing, and permit documentation.",
      overview: [
        "Accessory dwelling unit projects require clear site planning, efficient floor plans, and code-conscious documentation.",
        "Structural design addresses foundations and framing for the proposed unit and any connections to existing conditions.",
        "Permit packages are organized for submittal with architectural, structural, and supporting sheets as required.",
      ],
      featured: true,
    },
    {
      slug: "commercial-office-renovation",
      title: "Commercial Office Renovation",
      categories: ["Commercial", "MEP"],
      servicesLabel: "Architecture / Structural / MEP",
      services: ["Architectural Design", "Structural Engineering", "MEP Engineering"],
      image: "assets/images/projects/04.jpg",
      gallery: [
        "assets/images/projects/img-1.jpg",
        "assets/images/services/img-3.jpg",
        "assets/images/projects/img-4.jpg",
      ],
      description:
        "Integrated architectural, structural, and MEP design support for a commercial office renovation, including interior reconfiguration, HVAC, electrical layouts, structural modifications, and construction documentation.",
      overview: [
        "Office renovations often combine space planning with updates to mechanical, electrical, and plumbing systems.",
        "Structural modifications may include openings, supports, and framing changes coordinated with architectural layouts.",
        "Construction documents integrate disciplines to reduce conflicts during bidding and build-out.",
      ],
      featured: true,
    },
    {
      slug: "manufacturing-expansion",
      title: "Manufacturing Facility Expansion",
      categories: ["Industrial", "Structural", "MEP"],
      servicesLabel: "Structural Engineering / Architecture / MEP",
      services: ["Structural Engineering", "Architectural Design", "MEP Engineering"],
      image: "assets/images/projects/05.jpg",
      gallery: [
        "assets/images/projects/img-2.jpg",
        "assets/images/services/img-2.jpg",
        "assets/images/about-pic-2.jpg",
      ],
      description:
        "Engineering and design support for a manufacturing facility expansion, including structural steel framing, equipment foundations, architectural coordination, and process MEP systems.",
      overview: [
        "Industrial expansions require structural systems that support equipment loads, clearances, and production workflows.",
        "Architectural coordination addresses enclosures, access, and layout around process areas.",
        "MEP design supports equipment layout, power, and building services aligned with operational needs.",
      ],
      featured: true,
    },
    {
      slug: "warehouse-industrial",
      title: "Warehouse / Industrial Building",
      categories: ["Industrial", "Commercial"],
      servicesLabel: "Structural / Architectural / MEP",
      services: ["Structural Engineering", "Architectural Design", "MEP Engineering"],
      image: "assets/images/projects/06.jpg",
      gallery: [
        "assets/images/projects/img-2.jpg",
        "assets/images/projects/img-4.jpg",
        "assets/images/slider/slide-2.jpg",
      ],
      description:
        "Integrated design and engineering for an industrial warehouse facility, including structural framing, foundation systems, architectural layouts, loading areas, and building-system coordination.",
      overview: [
        "Warehouse and industrial facilities rely on efficient structural bays, foundations, and clear architectural planning for loading and circulation.",
        "Documentation packages coordinate structure, envelope, and building systems for permitting and construction.",
        "Representative content demonstrates typical scope; specific member sizes and systems depend on project requirements.",
      ],
      featured: true,
    },
    {
      slug: "healthcare-clinic",
      title: "Healthcare Clinic",
      categories: ["Healthcare", "MEP"],
      servicesLabel: "Architecture / Structural / MEP",
      services: ["Architectural Design", "Structural Engineering", "MEP Engineering"],
      image: "assets/images/projects/07.jpg",
      gallery: [
        "assets/images/projects/img-4.jpg",
        "assets/images/services/img-3.jpg",
        "assets/images/projects/img-3.jpg",
      ],
      description:
        "Architectural and engineering support for a healthcare clinic, including interior planning, structural modifications, HVAC systems, electrical layouts, plumbing, and coordinated construction documents.",
      overview: [
        "Clinical environments require thoughtful interior planning and coordinated MEP systems for comfort and functionality.",
        "Structural scope may include modifications to existing framing and supports for new layouts and equipment.",
        "Drawing sets are prepared to support review, permitting, and construction coordination.",
      ],
      featured: false,
    },
    {
      slug: "education-building",
      title: "Education Building",
      categories: ["Education", "MEP"],
      servicesLabel: "Architecture / Structural / MEP",
      services: ["Architectural Design", "Structural Engineering", "MEP Engineering"],
      image: "assets/images/projects/08.jpg",
      gallery: [
        "assets/images/projects/img-3.jpg",
        "assets/images/services/img-1.jpg",
        "assets/images/services/img-2.jpg",
      ],
      description:
        "Design and engineering support for an educational facility including architectural planning, structural systems, classroom layouts, HVAC, electrical, plumbing, and construction documentation.",
      overview: [
        "Educational facilities combine durable structural systems with flexible classroom and support space planning.",
        "MEP design addresses ventilation, power, and plumbing for learning environments.",
        "Documentation supports phased review and construction aligned with institutional standards.",
      ],
      featured: false,
    },
    {
      slug: "tenant-improvement",
      title: "Commercial Tenant Improvement",
      categories: ["Commercial", "MEP"],
      servicesLabel: "Architectural / MEP / Construction Documents",
      services: ["Architectural Design", "MEP Engineering", "Permit Documents"],
      image: "assets/images/projects/09.jpg",
      gallery: [
        "assets/images/projects/img-4.jpg",
        "assets/images/services/img-1.jpg",
        "assets/images/services/img-3.jpg",
      ],
      description:
        "Complete tenant-improvement documentation including space planning, reflected ceiling plans, interior elevations, lighting, HVAC, power, plumbing, and permit drawings.",
      overview: [
        "Tenant improvements require fast-turnaround documentation for leasing and permit submittals.",
        "Architectural sheets cover layouts, finishes, and interior elevations; MEP sheets address systems serving the suite.",
        "Packages are structured for contractor pricing and field execution.",
      ],
      featured: false,
    },
    {
      slug: "structural-retrofit",
      title: "Structural Retrofit",
      categories: ["Structural", "Renovation"],
      servicesLabel: "Structural Engineering",
      services: ["Structural Engineering", "Permit Documents"],
      image: "assets/images/projects/10.jpg",
      gallery: [
        "assets/images/services/img-2.jpg",
        "assets/images/about-pic-2.jpg",
        "assets/images/projects/img-1.jpg",
      ],
      description:
        "Structural evaluation and retrofit design support for an existing building, including existing-condition review, structural analysis, strengthening details, framing modifications, and construction documentation.",
      overview: [
        "Retrofit projects begin with review of existing conditions and structural capacity.",
        "Design solutions may include strengthening, new framing, or modified load paths with detailed construction sheets.",
        "Documentation supports permitting and contractor coordination for work in occupied or sensitive buildings.",
      ],
      featured: false,
    },
  ];

  var filterCategories = [
    "All",
    "Residential",
    "Commercial",
    "Industrial",
    "Healthcare",
    "Education",
    "Renovation",
    "Structural",
    "MEP",
  ];

  function assetPath(relative, base) {
    if (!relative) return "";
    if (/^https?:\/\//.test(relative) || relative.indexOf("../") === 0) return relative;
    return (base || "") + relative;
  }

  function getProjectBySlug(slug) {
    for (var i = 0; i < projects.length; i++) {
      if (projects[i].slug === slug) return projects[i];
    }
    return null;
  }

  function getFeaturedProjects(limit) {
    var list = projects.filter(function (p) {
      return p.featured;
    });
    if (list.length < limit) {
      list = projects.slice(0, limit);
    }
    return list.slice(0, limit || 6);
  }

  function getRelatedProjects(slug, limit) {
    var current = getProjectBySlug(slug);
    if (!current) return projects.slice(0, limit || 3);
    var scored = projects
      .filter(function (p) {
        return p.slug !== slug;
      })
      .map(function (p) {
        var score = 0;
        current.categories.forEach(function (c) {
          if (p.categories.indexOf(c) !== -1) score++;
        });
        return { project: p, score: score };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });
    return scored.slice(0, limit || 3).map(function (s) {
      return s.project;
    });
  }

  return {
    SEO_DESCRIPTION: SEO_DESCRIPTION,
    services: services,
    projects: projects,
    filterCategories: filterCategories,
    assetPath: assetPath,
    getProjectBySlug: getProjectBySlug,
    getFeaturedProjects: getFeaturedProjects,
    getRelatedProjects: getRelatedProjects,
  };
})();
