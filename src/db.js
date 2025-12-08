import Dexie from 'dexie';

export const db = new Dexie('EduReachDB');

// Define database schema (v2 introduces studyLog table for dashboard analytics)

// Configure schema stores for courses, flashcards, user progress, and streaks logger
db.version(2).stores({
  courses: '++id, title, subject, difficulty',
  flashcards: '++id, courseId, nextReview',
  progress: '++id, courseId',
  studyLog: '++id, date, type'
});

// Helper to log a study activity for analytics and streak calculation
/**
 * Logs a study event (lesson completion, quiz attempt, card review) to IndexedDB
 * for tracking streaks and daily contribution calendar counts.
 * @param {string} type - The type of learning activity.
 */
export async function logStudyActivity(type) {
  try {
    const todayStr = new Date().toLocaleDateString('sv'); // Formats as YYYY-MM-DD in local time
    
    // Check if we already logged this specific activity type today
    const existing = await db.studyLog
      .where('date').equals(todayStr)
      .and(item => item.type === type)
      .first();

    if (!existing) {
      await db.studyLog.add({
        date: todayStr,
        type,
        timestamp: new Date().toISOString()
      });
      console.log(`[Database] Logged study activity: ${type} for ${todayStr}`);
    }
  } catch (err) {
    console.error("Failed to log study activity:", err);
  }
}

// Helper to seed initial sample data if database is empty
/**
 * Seeds IndexedDB with high-quality educational modules (AI, Space, Water Cycle, Geometry)
 * when starting the application for the first time.
 */
export async function seedDatabase() {
  const courseCount = await db.courses.count();
  if (courseCount > 0) return; // Already seeded

  console.log("[Database] Seeding rich initial educational data...");

  // COURSE 1: Foundations of Artificial Intelligence & Neural Networks
  
// Insert default artificial intelligence course modules
const aiCourseId = await db.courses.add({
    title: "Foundations of AI & Neural Networks",
    description: "Unravel the mechanics behind machine learning models, perceptrons, and the future of deep learning.",
    subject: "Technology",
    difficulty: "Intermediate",
    lessons: [
      {
        title: "Introduction to Machine Learning",
        content: "At its core, **Machine Learning (ML)** is a method of data analysis that automates analytical model building. Instead of writing explicit instructions to solve a problem, developers feed algorithms large datasets and allow them to learn patterns. There are three main types of ML: **Supervised Learning** (where the data is labeled), **Unsupervised Learning** (where the model finds hidden structures in unlabeled data), and **Reinforcement Learning** (learning through rewards and penalties)."
      },
      {
        title: "How Neural Networks Work",
        content: "Artificial Neural Networks (ANNs) are inspired by the human brain. They consist of layers of interconnected **neurons** (nodes). \n\n1. **Input Layer**: Receives raw data (like pixel values of an image).\n2. **Hidden Layers**: Perform mathematical transformations on the input using weights and biases.\n3. **Output Layer**: Produces the final prediction (like classifying the image as a 'cat' or 'dog').\n\nEach neuron calculates a weighted sum of its inputs, adds a bias, and passes the result through an **activation function** (like ReLU or Sigmoid) to introduce non-linearity, enabling the model to learn complex, non-linear relationships."
      },
      {
        title: "Training Models & Backpropagation",
        content: "To train a neural network, we feed it inputs and compare its output to the true target. The difference is calculated using a **Loss Function**. The goal is to minimize this loss. **Backpropagation** is the core algorithm used to achieve this: it calculates the gradient of the loss function with respect to the weights by working backward layer-by-layer. An optimizer, like **Gradient Descent**, then updates the weights in the direction that reduces the error. Repeated over thousands of training loops, the network's accuracy progressively improves."
      }
    ],
    quizzes: [
      {
        question: "What is the primary difference between machine learning and traditional programming?",
        options: [
          "ML uses binary code, while traditional programming does not.",
          "ML algorithms learn patterns from data instead of using explicitly written code logic.",
          "ML can only run on quantum supercomputers.",
          "Traditional programming does not support mathematical equations."
        ],
        answer: 1,
        explanation: "In traditional programming, you write the rules and run them on data. In machine learning, you input data and outcomes, and the algorithm learns the rules."
      },
      {
        question: "Which layer in a neural network is responsible for producing the final classification or prediction?",
        options: [
          "The Input Layer",
          "The Hidden Layer",
          "The Activation Function Layer",
          "The Output Layer"
        ],
        answer: 3,
        explanation: "The Output Layer is the final layer that yields the model's prediction or classification outcome."
      },
      {
        question: "What is the purpose of backpropagation in deep learning?",
        options: [
          "To delete unnecessary data from the system.",
          "To calculate gradients of the loss function to update the model's weights and reduce error.",
          "To transfer model weights from a cloud server to local browser cache.",
          "To introduce non-linearity into the input data."
        ],
        answer: 1,
        explanation: "Backpropagation computes the error gradient backward through the network, allowing optimizers to tweak weights and minimize overall model loss."
      }
    ]
  });

  // Seed AI Course Flashcards
  await db.flashcards.bulkAdd([
    {
      courseId: aiCourseId,
      question: "What are the three main types of Machine Learning?",
      answer: "Supervised Learning, Unsupervised Learning, and Reinforcement Learning.",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    },
    {
      courseId: aiCourseId,
      question: "What is the function of activation functions in a neuron?",
      answer: "To introduce non-linearity, allowing the neural network to learn complex relationships.",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    },
    {
      courseId: aiCourseId,
      question: "What algorithm is used to compute error gradients backward layer-by-layer?",
      answer: "Backpropagation.",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    }
  ]);

  // COURSE 2: A Journey Through Space Exploration
  const spaceCourseId = await db.courses.add({
    title: "A Journey Through Space Exploration",
    description: "Trace humanity's steps from the early Space Race to the Apollo moon landing and modern Mars rovers.",
    subject: "History",
    difficulty: "Intermediate",
    lessons: [
      {
        title: "The Dawn of the Space Race",
        content: "The era of space exploration began in the mid-20th century, fueled by political tensions of the Cold War. In October 1957, the Soviet Union shocked the world by launching **Sputnik 1**, the first artificial satellite, into Earth orbit. This event triggered the **Space Race** between the United States and the USSR. The Soviets achieved another milestone in April 1961, when cosmonaut **Yuri Gagarin** became the first human in space, orbiting the Earth aboard Vostok 1."
      },
      {
        title: "Project Apollo & Landing on the Moon",
        content: "In response to early Soviet successes, US President John F. Kennedy declared the goal of landing a man on the moon before the 1960s ended. NASA developed the **Apollo Program**. On July 20, 1969, the **Apollo 11** lunar module landed on the moon's Sea of Tranquility. **Neil Armstrong** stepped onto the surface, declaring it 'one small step for man, one giant leap for mankind.' Along with Buzz Aldrin, he collected samples and conducted experiments, achieving an unprecedented engineering milestone."
      },
      {
        title: "Modern Mars Exploration & the Future",
        content: "Today, space exploration has shifted from geopolitical competition to international collaboration and commercial enterprises. Mars has become a primary target. Rovers like **Curiosity** and **Perseverance** analyze Martian soil for signs of past microbial life and prepare for future human visits. Additionally, the **Artemis Program** aims to establish a sustainable human presence on the moon, serving as a stepping stone for the ultimate journey: sending astronauts to Mars."
      }
    ],
    quizzes: [
      {
        question: "Which nation launched the first artificial satellite, Sputnik 1, into orbit?",
        options: ["United States", "Soviet Union", "United Kingdom", "Germany"],
        answer: 1,
        explanation: "Sputnik 1 was launched by the Soviet Union on October 4, 1957, kicking off the Space Race."
      },
      {
        question: "Who was the first astronaut to step onto the surface of the Moon?",
        options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"],
        answer: 2,
        explanation: "Neil Armstrong was the commander of Apollo 11 and became the first human to walk on the Moon on July 20, 1969."
      },
      {
        question: "What is the name of NASA's modern program aimed at landing humans back on the Moon?",
        options: ["Apollo 2.0", "Orion Mission", "Artemis Program", "Voyager Journey"],
        answer: 2,
        explanation: "The Artemis Program is NASA's current mission to land the first woman and next man on the Moon and establish a sustainable lunar camp."
      }
    ]
  });

  // Seed Space Course Flashcards
  await db.flashcards.bulkAdd([
    {
      courseId: spaceCourseId,
      question: "Who was the first human in space?",
      answer: "Yuri Gagarin (Soviet Union, April 1961).",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    },
    {
      courseId: spaceCourseId,
      question: "What year did Apollo 11 land on the Moon?",
      answer: "1969.",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    },
    {
      courseId: spaceCourseId,
      question: "What is the primary target for modern rover explorations in our Solar System?",
      answer: "Mars (searching for organic compounds and historic microbial life).",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    }
  ]);

  // COURSE 3: The Water Cycle & Climate Ecology
  const waterCourseId = await db.courses.add({
    title: "The Water Cycle & Climate Ecology",
    description: "Learn how water circulates through our planet and sustains fragile ecosystems.",
    subject: "Science",
    difficulty: "Beginner",
    lessons: [
      {
        title: "Evaporation & Condensation",
        content: "Water on Earth is constantly moving. The process begins with **Evaporation**, where energy from the sun heats up water in lakes, rivers, and oceans, turning liquid water into gas (water vapor) that rises into the atmosphere. As water vapor rises higher, it cools down and turns back into tiny liquid water droplets. This process is called **Condensation**. These droplets gather together to form clouds. When you look at clouds, you are seeing condensed water vapor."
      },
      {
        title: "Precipitation & Collection",
        content: "When clouds become too heavy with water droplets, they release the water back to Earth. This process is called **Precipitation**. Depending on the temperature, precipitation can fall as rain, snow, sleet, or hail. Once water falls to the ground, it accumulates in bodies of water, sinks into the soil to become groundwater, or flows as surface runoff. This is called **Collection**. The cycle then restarts as the sun heats the collected water, repeating the loop."
      },
      {
        title: "Ecosystem Balance & Climate Impacts",
        content: "The water cycle plays a vital role in maintaining ecological balance. It distributes nutrients, sustains plant and animal life, and regulates global temperatures. However, climate change is disrupting this cycle. Rising global temperatures increase evaporation rates, leading to more intense droughts in some regions and severe flooding and storms in others. Protecting wetlands and forests is crucial to preserving local water cycles and restoring climate resilience."
      }
    ],
    quizzes: [
      {
        question: "What is the process called when liquid water turns into gas/vapor?",
        options: ["Condensation", "Evaporation", "Precipitation", "Collection"],
        answer: 1,
        explanation: "Evaporation is when heat from the sun causes liquid water to absorb energy and turn into gaseous water vapor."
      },
      {
        question: "Which process is directly responsible for cloud formation?",
        options: ["Precipitation", "Evaporation", "Condensation", "Runoff"],
        answer: 2,
        explanation: "Condensation occurs when water vapor cools down and turns back into liquid droplets, which group together to form clouds."
      },
      {
        question: "How does rising global temperatures affect the water cycle?",
        options: [
          "It freezes all liquid water instantly.",
          "It completely stops evaporation.",
          "It accelerates evaporation, leading to extreme weather like severe droughts and heavy storms.",
          "It makes rain fall upward."
        ],
        answer: 2,
        explanation: "Higher temperatures speed up evaporation, resulting in dryer soils (droughts) and more moisture in the air that falls as heavier rainfall elsewhere."
      }
    ]
  });

  // Seed Water Course Flashcards
  await db.flashcards.bulkAdd([
    {
      courseId: waterCourseId,
      question: "What powers the water cycle?",
      answer: "The Sun (solar energy).",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    },
    {
      courseId: waterCourseId,
      question: "What is precipitation?",
      answer: "Water released from clouds in the form of rain, snow, sleet, or hail.",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    },
    {
      courseId: waterCourseId,
      question: "What is condensation?",
      answer: "The cooling of water vapor into liquid water droplets, forming clouds.",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    }
  ]);

  // COURSE 4: Master the Basics of Geometry
  const geometryCourseId = await db.courses.add({
    title: "Master the Basics of Geometry",
    description: "Learn the core properties of points, lines, angles, and two-dimensional shapes.",
    subject: "Mathematics",
    difficulty: "Beginner",
    lessons: [
      {
        title: "Points, Lines, and Angles",
        content: "A **point** is a location in space with no size, length, or width. A **line** is a straight path of points that extends infinitely in two directions. When two lines or rays intersect at a common endpoint (called the **vertex**), they form an **angle**. Angles are measured in degrees. A **right angle** is exactly 90 degrees, an **acute angle** is less than 90 degrees, and an **obtuse angle** is greater than 90 degrees but less than 180 degrees."
      },
      {
        title: "Polygons & Triangles",
        content: "A **polygon** is a closed two-dimensional shape with straight sides. The simplest polygon is a **triangle**, which has three sides and three angles. A key rule of geometry is that the sum of the interior angles of any triangle is always **180 degrees**. Other common polygons include quadrilaterals (four sides), pentagons (five sides), and hexagons (six sides)."
      }
    ],
    quizzes: [
      {
        question: "What is an angle called that measures exactly 90 degrees?",
        options: ["Acute angle", "Obtuse angle", "Right angle", "Straight angle"],
        answer: 2,
        explanation: "A 90-degree angle forms a perfect square corner and is called a Right Angle."
      },
      {
        question: "What is the sum of the interior angles of any triangle?",
        options: ["90 degrees", "180 degrees", "360 degrees", "270 degrees"],
        answer: 1,
        explanation: "No matter the shape of the triangle (equilateral, isosceles, or scalene), its three inner angles always sum up to exactly 180 degrees."
      }
    ]
  });

  // Seed Geometry Course Flashcards
  await db.flashcards.bulkAdd([
    {
      courseId: geometryCourseId,
      question: "What is an acute angle?",
      answer: "An angle that measures less than 90 degrees.",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    },
    {
      courseId: geometryCourseId,
      question: "What is a vertex?",
      answer: "The common endpoint where two rays or lines meet to form an angle.",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString()
    }
  ]);

  // Seed default progress entries
  await db.progress.bulkAdd([
    { courseId: aiCourseId, completedLessons: [], quizScores: {} },
    { courseId: spaceCourseId, completedLessons: [], quizScores: {} },
    { courseId: waterCourseId, completedLessons: [], quizScores: {} },
    { courseId: geometryCourseId, completedLessons: [], quizScores: {} }
  ]);
}
