$(document).ready(function () {
    const apiKey =
        "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";
    const username = "johnpapa";
    let currentPage = 1;
    let repositoriesPerPage = 10;
    let totalPages;
    let filteredRepositories = []; // Define filteredRepositories globally

    const repositoriesContainer = $("#repositoriesContainer");
    const paginationContainer = $("#paginationContainer");
    const loader = $("#loader");
    const perPageInput = $("#perPageInput");
    const searchInput = $("#searchInput");
    const userInfoContainer = $("#userInfoContainer");

    async function fetchUserData() {
        const userUrl = `https://api.github.com/users/${username}`;
        const headers = new Headers({
            Authorization: `Bearer ${apiKey}`,
        });

        const requestOptions = {
            method: "GET",
            headers: headers,
        };

        try {
            const response = await fetch(userUrl, requestOptions);
            if (!response.ok) {
                throw new Error(`Error fetching user data: ${response.status}`);
            }

            const userData = await response.json();
            console.log("User Data:", userData);
            fetchRepositories(userData);
        } catch (error) {
            console.error(error.message);
            loader.hide();
        }
    }

    async function fetchRepositories(userData) {
        let total_rep = 0;
        const apiUrl1 = `https://api.github.com/users/${username}`;
        const apiUrl2 = `https://api.github.com/users/${username}/repos?page=${currentPage}&per_page=${repositoriesPerPage}`;

        const headers = new Headers({
            Authorization: `Bearer ${apiKey}`,
        });

        const requestOptions = {
            method: "GET",
            headers: headers,
        };

        try {
            // Fetch user data first
            const resp = await fetch(apiUrl1, requestOptions);
            if (!resp.ok) {
                throw new Error(`Error fetching user data: ${resp.status}`);
            }
            const userDataResponse = await resp.json();

            // Assign user data only if it's available
            if (userDataResponse && userDataResponse.avatar_url) {
                userData = userDataResponse;
            }

            total_rep = userDataResponse.public_repos;
            console.log("User Data:", userData);
        } catch (error) {
            console.error(error.message);
        } finally {
            // Now fetch repositories with the possibly updated userData
            try {
                const response = await fetch(apiUrl2, requestOptions);
                if (!response.ok) {
                    throw new Error(
                        `Error fetching repositories: ${response.status}`
                    );
                }

                const data = await response.json();
                renderUserData(userData);
                renderRepositories(data);
                renderPagination(total_rep);
            } catch (error) {
                console.error(error.message);
            } finally {
                loader.hide();
            }
        }
    }

    function renderUserData(userData) {
        userInfoContainer.empty(); // Clear existing content

        // Create user details structure
        const userDetailElement = $("<div>").attr("id", "userDetails");
        userDetailElement.append(
            $("<img>")
                .attr("id", "userImage")
                .attr("src", userData.avatar_url)
                .attr("alt", "User Image")
                .css("width", "30%")  // Set the width to 25% of the original size
            ,
            $("<div>")
                .attr("id", "userText")
                .append(
                    $("<h2>").attr("id", "username").text(userData.login),
                    $("<p>").attr("id", "userBio").text(userData.bio),
                    $("<p>").attr("id", "userLocation").text(userData.location),
                    $("<div>").attr("id", "socialMedia")
                )
        );

        // Add social media links
        const socialMediaContainer = $("#socialMedia");
        if (userData.twitter) {
            socialMediaContainer.append(
                `<a href="${userData.twitter}" target="_blank">Twitter</a>`
            );
        }
        // Add more social media links as needed

        userInfoContainer.append(userDetailElement);

        // Update GitHub URL
        const githubUrlContainer = $("<div>").attr("id", "githubUrl");
        githubUrlContainer.append(
            $("<p>").attr("id", "githubUrlText").text("🔗"+userData.html_url)
        );
        userInfoContainer.append(githubUrlContainer);
    }

    function renderRepositories(repositories) {
        repositoriesContainer.empty(); // Clear existing content

        const row = $("<div>").addClass("row");

        repositories.forEach((repo, index) => {
            const repoCard = $("<div>")
                .addClass("repoCard col-md-6")
                .append(
                    $("<h3>").addClass("repoTitle").text(repo.name),
                    $("<p>")
                        .addClass("repoDescription")
                        .text(repo.description || "No description available."),
                    $("<div>").addClass("techStack")
                );

            // Fetch the languages and their contributions
            if (repo.languages_url) {
                fetch(repo.languages_url)
                    .then((response) => response.json())
                    .then((languages) => {
                        // Sort the languages by contribution in descending order
                        const sortedLanguages = Object.entries(languages).sort(
                            (a, b) => b[1] - a[1]
                        );

                        // Display up to top 3 languages with highest contributions
                        for (
                            let i = 0;
                            i < Math.min(sortedLanguages.length, 3);
                            i++
                        ) {
                            const [language, contribution] = sortedLanguages[i];
                            repoCard
                                .find(".techStack")
                                .append(
                                    `<span class="tech">${language} </span>`
                                );
                        }
                    })
                    .catch((error) =>
                        console.error("Error fetching languages:", error)
                    );
            }

            row.append(repoCard);
        });

        repositoriesContainer.append(row);
    }


    function renderPagination(totalRepos) {
        totalPages = Math.ceil(totalRepos / repositoriesPerPage);
        paginationContainer.empty(); // Clear existing content

        const paginationRow = $("<div>").addClass("row").css({
            display: "flex",
            justifyContent: "center",
        });

        const paginationCol = $("<div>").addClass("col-md-12 text-center");

        // Previous button
        const previousButton = $("<button>")
            .addClass("btn btn-secondary mr-2 ctr") // Added ctr class for center alignment
            .text("<<")
            .click(() => {
                if (currentPage > 1) {
                    changePage(currentPage - 1);
                }
            });
        paginationCol.append(previousButton);

        // Page numbers
        const visiblePages = 9;
        const halfVisible = Math.floor(visiblePages / 2);
        let startPage = Math.max(currentPage - halfVisible, 1);
        let endPage = Math.min(startPage + visiblePages - 1, totalPages);
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = $("<button>")
                .addClass(
                    `btn btn-secondary mr-2 ${
                        currentPage === i ? "btn-info" : ""
                    } ctr` // Added ctr class for center alignment
                )
                .text(i)
                .click(() => changePage(i));
            paginationCol.append(pageButton);
        }

        // Next button
        const nextButton = $("<button>")
            .addClass("btn btn-secondary mr-2 ctr") // Added ctr class for center alignment
            .text(">>")
            .click(() => {
                if (currentPage < totalPages) {
                    changePage(currentPage + 1);
                }
            });
        paginationCol.append(nextButton);

        paginationRow.append(paginationCol);
        paginationContainer.append(paginationRow);

        // New row for Older and Newer buttons with space below
        const buttonRow = $("<div>").addClass("row").css({
            display: "flex",
            justifyContent: "space-around",
            marginTop: "10px",
            marginBottom: "10px",
        });

        // Create columns for Older and Newer buttons
        const olderButtonCol = $("<div>").addClass("col-md-6 text-center");
        const newerButtonCol = $("<div>").addClass("col-md-6 text-center");

        // Older button
        const olderButton = $("<button>")
            .addClass("btn btn-secondary mr-2 ctr")
            .text("Older") // Label for the "Older" button
            .click(() => shiftPages(-1)); // Call the shiftPages function with -1 direction
        olderButtonCol.append(olderButton);

        // Newer button
        const newerButton = $("<button>")
            .addClass("btn btn-secondary mr-2 ctr")
            .text("Newer") // Label for the "Newer" button
            .click(() => shiftPages(1)); // Call the shiftPages function with 1 direction
        newerButtonCol.append(newerButton);

        // Append the columns for Older and Newer buttons to the row
        buttonRow.append(olderButtonCol, newerButtonCol);
        // Append the row for Older and Newer buttons to the pagination container
        paginationContainer.append(buttonRow);
    }

    function shiftPages(direction) {
        const visiblePages = 9;
        const halfVisible = Math.floor(visiblePages / 2);

        if (direction === -1) {
            // Move to the previous set of pages
            currentPage = Math.max(currentPage - visiblePages, 1);
        } else {
            // Move to the next set of pages
            currentPage = Math.min(
                currentPage + visiblePages,
                totalPages - halfVisible
            );
        }

        fetchRepositories();
    }

    function changePage(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            fetchRepositories();
        }
    }

    function updatePerPage() {
        repositoriesPerPage = parseInt(perPageInput.val(), 10) || 10;
        currentPage = 1; // Reset to the first page when changing repositories per page
        fetchRepositories();
    }

    async function handleSearch() {
        const searchTerm = searchInput.val().trim().toLowerCase();

        // Show loader while the API call is in progress
        loader.show();

        try {
            if (searchTerm === "") {
                // If the search bar is empty, fetch all repositories
                renderRepositories(filteredRepositories);
                renderPagination(filteredRepositories.length);
                fetchRepositories();
            } else {
                // If there is a search term, filter repositories based on the term
                const apiUrl = `https://api.github.com/users/${username}/repos`;

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(
                        `Error fetching repositories: ${response.status}`
                    );
                }

                const data = await response.json();
                // Update the global filteredRepositories variable
                filteredRepositories = data.filter((repo) =>
                    repo.name.toLowerCase().includes(searchTerm)
                );
                renderRepositories(filteredRepositories);
                renderPagination(filteredRepositories.length);
            }
        } catch (error) {
            console.error(error.message);
        } finally {
            // Hide the loader after the API call is complete
            loader.hide();
        }
    }

    // Event listeners
    perPageInput.on("input", updatePerPage);
    searchInput.on("input", handleSearch);

    // Initial fetch
    fetchUserData();
});

