////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////     SEARCH PAGE     ////////////////////////////////////////////////

// Common utility function to get URL parameters
function getURLParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Code for the search page (search.html)
if (window.location.pathname.includes("index.html")) {
    let diseaseNames = [];

    // Load diseases from CSV with D3 and implement search functionality
    d3.csv("data_info.csv").then((data) => {
    diseaseNames = data.map((row) => row.Name);
    });

    const searchBar = document.getElementById("search-bar");
    const suggestions = document.getElementById("suggestions");
    const searchButton = document.getElementById("search-button");
    let selectedDisease = "";

    // Filter suggestions based on input
    searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();
    const matches = diseaseNames.filter((name) => name.toLowerCase().includes(query));

    // Clear suggestions
    suggestions.innerHTML = "";

    // Display filtered suggestions
    matches.forEach((name) => {
        const li = document.createElement("li");
        li.textContent = name;
        li.addEventListener("click", () => {
        searchBar.value = name;
        selectedDisease = name;
        suggestions.innerHTML = ""; 
        });
        suggestions.appendChild(li);
    });
    });

    // Redirect to another page with selected disease
    searchButton.addEventListener("click", () => {
    if (searchBar.value) {
        const diseaseName = selectedDisease || searchBar.value;
        const encodedDisease = encodeURIComponent(diseaseName);
        window.location.href = `disease-info.html?disease=${encodedDisease}`;
    }
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////     INFO PAGE    /////////////////////////////////////////////////
  
if (window.location.pathname.includes("disease-info.html")) {
    const diseaseName = decodeURIComponent(getURLParameter("disease"));
    document.getElementById("disease-name").textContent = `${diseaseName}`;

    document.title = diseaseName;
  
    // Select the containers
    const diseaseCodes = d3.select("#disease-codes");
    const diseaseDetails = d3.select("#disease-details");
    const diseaseDescription = diseaseDetails.select("#disease-description");
    const diseaseSymptoms = diseaseDetails.select("#disease-symptoms");

    // Colors for frequency
    const frequencyColors = {
        "Obligate (100%)": "firebrick",
        "Very frequent (99-80%)": "orangered",
        "Frequent (79-30%)": "orange",
        "Occasional (29-5%)": "limegreen",
        "Very rare (<4-1%)": "green",
        "Excluded (0%)": "gray"
    };

    function displayFrequencies(symptoms) {
        const diseaseSymptoms = d3.select("#disease-symptoms");

        // Clear actual content (to evict duplicate)
        diseaseSymptoms.selectAll("*").remove();

        // Add title and description for the symptoms
        diseaseSymptoms.append("h3")
            .text("Symptoms")
            .style("text-align", "center");

        diseaseSymptoms.append("p")
            .text("Click on a frequency to see the corresponding symptoms:")
            .style("text-align", "center");

        // Add frequencies side by side
        const frequenciesDiv = diseaseSymptoms.append("div")
            .attr("class", "frequencies")
            .style("display", "flex")
            .style("flex-wrap", "wrap")
            .style("justify-content", "center")
            .style("gap", "15px")
            .style("margin", "20px auto");

        Object.keys(frequencyColors).forEach(frequency => {
            frequenciesDiv.append("div")
                .attr("class", "frequency")
                .text(frequency)
                .style("color", frequencyColors[frequency])
                .style("cursor", "pointer")
                .on("click", () => displaySymptomsForFrequency(frequency, symptoms));
        });

        // Area for show the symptoms
        diseaseSymptoms.append("div")
            .attr("id", "symptom-list")
            .style("margin-top", "20px")
            .style("text-align", "center")
            .style("margin", "10px auto"); 
    }

    function displaySymptomsForFrequency(frequency, symptoms) {
        const symptomListDiv = d3.select("#symptom-list");

        // Filter symptoms based on frequency
        const symptomsForFrequency = symptoms
            .filter(symptom => symptom.Frequency === frequency)
            .map(symptom => symptom.HPOTerm);

        symptomListDiv.html("");

        if (symptomsForFrequency.length > 0) {
            // Show symptoms
            symptomListDiv.html(`
                <p><strong>${frequency} symptoms</strong>: ${symptomsForFrequency.join(", ")}</p>
            `);
        } else {
            // Text in case there's no symptoms
            symptomListDiv.html(`
                <p>No results found for <strong>${frequency}</strong> symptoms.</p>
            `);
        }
    }

    Promise.all([
        d3.csv("data_info.csv"),
        d3.csv("data_symptoms.csv")
    ]).then(([diseaseData, symptomData]) => {

        // Filter by selected disease
        const disease = diseaseData.find(row => row.Name === diseaseName);

        // Treat "None" or "NaN" values
        const formatValue = value => (value && value !== "None" && value !== "NaN" ? value : null);

        if (disease) {
            // Show info for codes and categories
            diseaseCodes.html(`
                <h3>Details</h3>
                ${formatValue(disease.Category) ? `<p><strong>Category:</strong> ${disease.Category}</p>` : ""}
                ${formatValue(disease.ClassificationLevel) ? `<p><strong>Classification Level:</strong> ${disease.ClassificationLevel}</p>` : ""}
                ${formatValue(disease.OrphaCode) ? `<p><strong>ORPHA:</strong> ${disease.OrphaCode}</p>` : ""}
                ${formatValue(disease.GARD) ? `<p><strong>GARD:</strong> ${disease.GARD}</p>` : ""}
                ${formatValue(disease.ICD-10) ? `<p><strong>ICD-10:</strong> ${disease.ICD-10}</p>` : ""}
                ${formatValue(disease.ICD-11) ? `<p><strong>ICD-11:</strong> ${disease.ICD-11}</p>` : ""}
                ${formatValue(disease.MeSH) ? `<p><strong>MeSH:</strong> ${disease.MeSH}</p>` : ""}
                ${formatValue(disease.MedDRA) ? `<p><strong>MedDRA:</strong> ${disease.MedDRA}</p>` : ""}
                ${formatValue(disease.OMIM) ? `<p><strong>OMIM:</strong> ${disease.OMIM}</p>` : ""}
                ${formatValue(disease.UMLS) ? `<p><strong>UMLS:</strong> ${disease.UMLS}</p>` : ""}
            `);

            // Show remaining info
            const synonyms = formatValue(disease.Synonyms) ? disease.Synonyms.split(";").join(", ") : null;
            diseaseDescription.html(`
                <h2>General Info</h2>
                ${formatValue(disease.Contents) ? `<p><strong>Definition:</strong> ${disease.Contents}</p>` : ""}
                ${formatValue(disease.Info) ? `<p><strong>Info:</strong> ${disease.Info}</p>` : ""}
                ${synonyms ? `<p><strong>Synonyms:</strong> ${synonyms}</p>` : ""}
                ${formatValue(disease.ExpertLink) ? `<a href="${disease.ExpertLink}" target="_blank">Learn more on ORPHANET</a>` : ""}
            `);

            const diseaseSymptomsData = symptomData.filter(row => row.Name === diseaseName);

            displayFrequencies(diseaseSymptomsData);
        } else {
            diseaseCodes.html("");
            diseaseDetails.html(`<p>No information available for the selected disease.</p>`);
            diseaseSymptoms.html("");
        }
    }).catch(error => {
        console.error("Error loading the CSVs:", error);
        diseaseCodes.html("");
        diseaseDetails.html(`<p>Failed to load disease information.</p>`);
        diseaseSymptoms.html("");
    });

    // Inititialize map
    const map = L.map('map').setView([0, 0], 2);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    d3.csv("map_data.csv").then(data => {
        const filteredData = data.filter(row => row.Disease === diseaseName);

        // If no data is found, display a message and stop execution
        if (filteredData.length === 0) {
            const container = d3.select("#map");
            container.html("");
            container.append("p")
                .text("No expert centres data available for this disease.")
                .style("font-size", "20px")
                .style("text-align", "center")
                .style("display", "flex")
                .style("justify-content", "center")
                .style("align-items", "center")
                .style("height", "100%");
            return; // Exit the function
        }

        // Calculate the average latitude and longitude to center the map
        const latitudes = filteredData.map(row => parseFloat(row.Latitude));
        const longitudes = filteredData.map(row => parseFloat(row.Longitude));
        const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
        const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

        map.setView([avgLat, avgLng], 2);

        // Add marker to the map
        filteredData.forEach(row => {
            const marker = L.marker([row.Latitude, row.Longitude], {
                icon: L.icon({
                    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                    shadowAnchor: [12, 41],
                    shadowSize: [41, 41]
                })
            }).addTo(map);

            // Add popup to the marker
            marker.bindPopup(`
                <b>${row.ResultName}</b><br>
                <p>${row.Address}</p>
                <button class="popup-button" onclick="showSection(
                    '${row.ResultName}',
                    '${row.Address}',
                    '${row.Description}',
                    '${row.Contact}',
                    '${row.ResultLink}',
                    '${row.Local}',
                    ${row.Latitude}, 
                    ${row.Longitude},
                    this
                )">Ver detalhes</button>
            `, { maxWidth: 180 });
        });
    });

    document.addEventListener("DOMContentLoaded", () => {
        const infoSection = document.getElementById('info-section');
        // Initialize the section as "hidden"
        infoSection.classList.add('hidden');
    });

    // Substitute links at description and contact values
    function substituteLinks(description, contact) {
        const regex = /https?:\/\/[^\s]+/g;

        description = description.replace(regex, (match) => {
        return `<a href="${match}" target="_blank">${match}</a>`;
        });

        contact = contact.replace(regex, (match) => {
        return `<a href="${match}" target="_blank">Official website</a>`;
        });

        return { description, contact };
    }

    function showSection(name, address, description, contact, link, local, lat, lon, button) {
        const infoSection = document.getElementById('info-section');
        const infoContent = document.getElementById('info-content');

        const { description: newdescription, contact: newcontact } = substituteLinks(description, contact);

        if (button.innerText === 'Hide details') {
            // Close section if it's visible
            closeSection(button);
        } else {
            // Update the section content with new data
            infoContent.innerHTML = `
            <h2>${name}</h2>
            <p><strong>${local}</strong></p>
            <p>${address}</p>
            <p>${newdescription}</p>
            <p>${newcontact}</p>
            <p><a href="${link}" target="_blank">${name} - ORPHANET</a></p>
            `;
            // Ensure the section is visible before showing
            infoSection.classList.remove('hidden'); 
            setTimeout(() => {
                infoSection.classList.add('show');
            }, 10);
            // Update text button
            button.innerText = 'Hide details';

            // Center the map at the specified local with zoom
            map.setView([lat, lon], 8);
        }
    }

    function closeSection(button = null) {
        const infoSection = document.getElementById('info-section');
        // Hide sider section
        infoSection.classList.remove('show');
        setTimeout(() => {
            infoSection.classList.add('hidden');
        }, 300);
        // Restore button text
        if (button) {
            button.innerText = 'See details';
        }
    }


    // Load data from CSV file
    d3.csv("data_funct.csv").then(data => {
        // Filter data by disease name
        const filteredData = data.filter(d => d.Name === diseaseName);

        // If no data is found, display a message and stop execution
        if (filteredData.length === 0) {
            const container = d3.select("#consequences-info")
                .style("height", "200px");
            container.html(""); // Clear any existing content
            container.append("p")
                .text("No functional consequences data available for this disease.")
                .style("font-size", "20px");
            return; // Exit the function
        }

        // Group data by Activity
        const groupedData = d3.group(filteredData, d => d.Activity);

        // Populate sidebar with activity list
        const activityList = d3.select("#activity-list");
        activityList.selectAll(".activity")
            .data(Array.from(groupedData.keys()))
            .enter()
            .append("div")
            .attr("class", "activity")
            .text(d => d)
            .on("click", function (event, activity) {
                displayDetails(activity, groupedData.get(activity));
            });

        // Display details of selected activity
        function displayDetails(activity, rows) {
            const detailsDiv = d3.select("#activity-details");
            detailsDiv.html("");
            detailsDiv.append("h2").text(activity);
            
            const table = detailsDiv.append("table");
            
            // Add table header
            const header = table.append("thead").append("tr");
            header.append("th").text("Limitation Type");
            header.append("th").text("Frequency");
            header.append("th").text("Level");
            header.append("th").text("Loss of Ability");
            
            // Add table rows
            const tbody = table.append("tbody");
            rows.forEach(row => {
                const tr = tbody.append("tr");
                tr.append("td").text(row.ConsequenceCategory);
                tr.append("td").text(row.Frequency);
                tr.append("td").text(row.Level);
                tr.append("td").text(row.LossOfAbility === "y" ? "Yes" : "No");
            });
        }
    }).catch(error => {
        console.error("Error loading the CSV file:", error);
        d3.select("#activity-list").append("p")
            .text("Error loading data. Please check the console for details.")
            .style("color", "red");
    });



    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("h2.title");

    // Define the scroll
    const OFFSET = window.innerHeight * 0.20;

    // Function to scroll till the section
    const scrollToSection = (event) => {
        event.preventDefault();
        const targetId = event.target.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId) || document.querySelector(`.${targetId}`);
        if (targetSection) {
            const sectionPosition = targetSection.getBoundingClientRect().top + window.scrollY - OFFSET;
            window.scrollTo({ top: sectionPosition, behavior: "smooth" });
        }
    };

    // Add click event at the links
    navLinks.forEach(link => link.addEventListener("click", scrollToSection));

    // Função para destacar o link ativo com base na rolagem
    const setActiveLink = () => {
        let currentSection = null;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            // Verify if the section is visible at least 50%
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                currentSection = section;
            }
        });

        // Update the active class at links
        navLinks.forEach(link => {
            link.classList.remove("active");
            if (currentSection && link.getAttribute("href") === `#${currentSection.parentElement.id}`) {
                link.classList.add("active");
            }
        });
    };

    // Update the active button when scrolling the page
    window.addEventListener("scroll", setActiveLink);

    // Function to adjust the content margin-top based on header height
    document.addEventListener("DOMContentLoaded", function() {
        function adjustMainMargin() {
          var header = document.getElementById('header');
          var mainContent = document.getElementById('disease-name');
          
          console.log("Header encontrado:", header);
          
          if (header && mainContent) {
            var headerHeight = header.offsetHeight;
            mainContent.style.marginTop = headerHeight + 20 + 'px';
          }
        }
  
        adjustMainMargin();
        window.addEventListener("resize", adjustMainMargin);
    });
}
