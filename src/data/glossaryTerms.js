// Glossary terms with their definitions
export const glossaryTerms = {
  // Technology Terms
  "API": "Application Programming Interface - a set of protocols and tools for building software applications that specifies how software components should interact.",
  "JavaScript": "A high-level, interpreted programming language that is widely used for web development to create interactive and dynamic web pages.",
  "React": "A JavaScript library for building user interfaces, particularly web applications, developed by Facebook.",
  "HTML": "HyperText Markup Language - the standard markup language used to create web pages and web applications.",
  "CSS": "Cascading Style Sheets - a style sheet language used for describing the presentation of a document written in HTML or XML.",
  "JSON": "JavaScript Object Notation - a lightweight data-interchange format that is easy for humans to read and write.",
  "HTTP": "HyperText Transfer Protocol - the foundation of data communication for the World Wide Web.",
  "HTTPS": "HyperText Transfer Protocol Secure - an extension of HTTP that uses encryption for secure communication.",
  "URL": "Uniform Resource Locator - a reference to a web resource that specifies its location on a computer network.",
  "DOM": "Document Object Model - a programming interface for HTML and XML documents that represents the page structure.",
  "AJAX": "Asynchronous JavaScript and XML - a technique for creating interactive web applications by exchanging data with a server asynchronously.",
  "SQL": "Structured Query Language - a domain-specific language used in programming for managing data in relational databases.",
  "NoSQL": "A database that provides a mechanism for storage and retrieval of data that is modeled differently than relational databases.",
  "Git": "A distributed version control system for tracking changes in source code during software development.",
  "GitHub": "A web-based platform that uses Git for version control and provides hosting for software development projects.",
  "Node.js": "A JavaScript runtime built on Chrome's V8 JavaScript engine that allows JavaScript to be run on the server side.",
  "npm": "Node Package Manager - the default package manager for Node.js that helps manage JavaScript packages and dependencies.",
  "Webpack": "A static module bundler for modern JavaScript applications that bundles JavaScript files for usage in a browser.",
  "Babel": "A JavaScript compiler that transforms modern JavaScript code into backwards-compatible versions for older browsers.",
  "TypeScript": "A programming language developed by Microsoft that builds on JavaScript by adding static type definitions.",

  // Business Terms
  "ROI": "Return on Investment - a performance measure used to evaluate the efficiency of an investment or compare efficiency of different investments.",
  "KPI": "Key Performance Indicator - a measurable value that demonstrates how effectively a company is achieving key business objectives.",
  "SaaS": "Software as a Service - a software distribution model where applications are hosted by a service provider and made available over the internet.",
  "B2B": "Business to Business - a form of transaction between businesses, such as between a manufacturer and wholesaler.",
  "B2C": "Business to Consumer - the process of selling products and services directly between a business and consumers.",
  "CRM": "Customer Relationship Management - a technology for managing all your company's relationships and interactions with customers.",
  "ERP": "Enterprise Resource Planning - business process management software that allows an organization to use integrated applications.",
  "MVP": "Minimum Viable Product - a development technique where a new product is developed with sufficient features to satisfy early adopters.",
  "Agile": "A project management and software development methodology that emphasizes flexibility, collaboration, and customer satisfaction.",
  "Scrum": "An agile framework for managing product development that emphasizes teamwork, accountability, and iterative progress.",
  "Kanban": "A visual system for managing work as it moves through a process, emphasizing continuous delivery without overburdening the team.",

  // General Terms
  "Algorithm": "A step-by-step procedure or formula for solving a problem or completing a task, especially in computing and mathematics.",
  "Database": "An organized collection of structured information, or data, typically stored electronically in a computer system.",
  "Server": "A computer or system that provides resources, data, services, or programs to other computers over a network.",
  "Client": "A computer or software application that accesses a service made available by a server in a client-server architecture.",
  "Framework": "A platform for developing software applications that provides a foundation with pre-written code and tools.",
  "Library": "A collection of pre-compiled routines that a program can use to perform common tasks or operations.",
  "IDE": "Integrated Development Environment - a software application that provides comprehensive facilities for software development.",
  "Debugging": "The process of finding and resolving defects or problems within a computer program that prevent correct operation.",
  "Deployment": "The process of installing, configuring, and enabling a specific application or set of applications on a server or system.",
  "Scalability": "The capability of a system to handle a growing amount of work by adding resources to the system.",
  "Performance": "A measure of how well a system or application operates in terms of speed, efficiency, and resource usage.",
  "Security": "The practice of protecting systems, networks, and programs from digital attacks and unauthorized access.",
  "Encryption": "The process of converting information or data into a code to prevent unauthorized access.",
  "Authentication": "The process of verifying the identity of a user, device, or system before granting access to resources.",
  "Authorization": "The process of giving someone permission to do or have something after they have been authenticated.",

  // Modern Tech Terms
  "Cloud": "A network of remote servers hosted on the internet to store, manage, and process data rather than a local server.",
  "AI": "Artificial Intelligence - the simulation of human intelligence in machines programmed to think and learn like humans.",
  "ML": "Machine Learning - a type of artificial intelligence that enables computers to learn and improve from experience automatically.",
  "IoT": "Internet of Things - the network of physical objects embedded with sensors and software to connect and exchange data.",
  "Blockchain": "A distributed ledger technology that maintains a continuously growing list of records linked and secured using cryptography.",
  "Microservices": "An architectural approach where applications are built as a collection of loosely coupled, independently deployable services.",
  "DevOps": "A set of practices that combines software development and IT operations to shorten development lifecycle and provide continuous delivery.",
  "Container": "A lightweight, standalone package that includes everything needed to run an application: code, runtime, tools, and libraries.",
  "Docker": "A platform that uses containerization technology to package applications and their dependencies into portable containers.",
  "Kubernetes": "An open-source container orchestration platform for automating deployment, scaling, and management of containerized applications."
};

// Function to get a random subset of terms for demonstration
export const getRandomTerms = (count = 10) => {
  const terms = Object.keys(glossaryTerms);
  const shuffled = terms.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).reduce((obj, term) => {
    obj[term] = glossaryTerms[term];
    return obj;
  }, {});
};

// Function to search terms
export const searchTerms = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return Object.keys(glossaryTerms).filter(term => 
    term.toLowerCase().includes(lowercaseQuery) || 
    glossaryTerms[term].toLowerCase().includes(lowercaseQuery)
  ).reduce((obj, term) => {
    obj[term] = glossaryTerms[term];
    return obj;
  }, {});
};