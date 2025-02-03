  // Import the necessary Firebase functions
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
  import { getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";

  // Your Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBR1upksUuQxY5OaIjb_yPDHWi7TzhhTr0",
    authDomain: "neighborhoodcatinfo.firebaseapp.com",
    projectId: "neighborhoodcatinfo",
    storageBucket: "neighborhoodcatinfo.firebasestorage.app",
    messagingSenderId: "661276936276",
    appId: "1:661276936276:web:5d1993ae59758877c8c5c1",
    measurementId: "G-BK2FHSD2QM"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const db = getFirestore(app);

  // Function to show notifications
  function showNotification(message, type = "success") {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.className = `notification show`; // Reset classes
      if (type === "error") {
          notification.classList.add('error');
      } else if (type === "info") {
          notification.classList.add('info');
      }

      // Hide notification after 3 seconds
      setTimeout(() => {
          notification.classList.remove('show');
      }, 3000);
  }

  // Function to add a feeding record to Firestore with formatted time
  async function recordFeeding(type) {
      const currentTime = new Date();
      const options = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true
      };
      let formattedTime = currentTime.toLocaleString('en-GB', options); // '26/01/2025, 5:58:41 PM'

      // Ensure AM/PM is capitalized
      formattedTime = formattedTime.replace(/am|pm/i, match => match.toUpperCase());

      try {
          const docRef = await addDoc(collection(db, "feedingRecords"), {
              type: type,
              time: formattedTime,
              deleted: false
          });
          console.log("Feeding record added with ID: ", docRef.id);
          showNotification("Feeding record added successfully!", "success");
          // No need to call loadRecords() as onSnapshot handles it
      } catch (e) {
          console.error("Error adding document: ", e);
          showNotification("Failed to add feeding record. Please try again.", "error");
      }
  }

  // Function to delete (mark as deleted) a feeding record in Firestore
  async function deleteRecord(id) {
      const recordRef = doc(db, "feedingRecords", id);
      try {
          await updateDoc(recordRef, {
              deleted: true
          });
          console.log("Feeding record marked as deleted.");
          showNotification("Feeding record deleted successfully!", "success");
          // No need to call loadRecords() as onSnapshot handles it
      } catch (e) {
          console.error("Error updating document: ", e);
          showNotification("Failed to delete feeding record. Please try again.", "error");
      }
  }

  // Function to load and display the latest 10 non-deleted records from Firestore with real-time updates
  function loadRecords() {
      const recordList = document.getElementById('recordList');
      recordList.innerHTML = ''; // Clear existing records

      const q = query(
          collection(db, "feedingRecords"),
          where("deleted", "==", false),
          orderBy("time", "desc"),
          limit(10)
      );

      // Set up real-time listener
      onSnapshot(q, (querySnapshot) => {
          recordList.innerHTML = ''; // Clear existing records each time there's a change
          querySnapshot.forEach((docSnapshot) => {
              const record = docSnapshot.data();
              const listItem = document.createElement('li');

              const recordText = `Someone fed ${record.type} at ${record.time}`;
              const textSpan = document.createElement('span');
              textSpan.textContent = recordText;

              const deleteBtn = document.createElement('button');
              deleteBtn.textContent = 'Delete';
              deleteBtn.className = 'delete-btn';
              deleteBtn.onclick = () => deleteRecord(docSnapshot.id);

              listItem.appendChild(textSpan);
              listItem.appendChild(deleteBtn);
              recordList.appendChild(listItem);
          });
      }, (error) => {
          console.error("Error fetching feeding records: ", error);
          showNotification("Error fetching feeding records. Please try again later.", "error");
      });
  }

  // Function to load and display all records in the modal from Firestore with real-time updates
  function loadCompleteRecords() {
      const completeRecordList = document.getElementById('completeRecordList');
      completeRecordList.innerHTML = ''; // Clear existing records

      const q = query(
          collection(db, "feedingRecords"),
          orderBy("time", "desc")
      );

      // Set up real-time listener
      onSnapshot(q, (querySnapshot) => {
          completeRecordList.innerHTML = ''; // Clear existing records each time there's a change
          querySnapshot.forEach((docSnapshot) => {
              const record = docSnapshot.data();
              const listItem = document.createElement('li');
              listItem.textContent = `Someone fed ${record.type} at ${record.time}` + (record.deleted ? ' (deleted)' : '');
              if (record.deleted) {
                  listItem.classList.add('deleted');
              }
              completeRecordList.appendChild(listItem);
          });
      }, (error) => {
          console.error("Error fetching complete feeding records: ", error);
          showNotification("Error fetching complete feeding records. Please try again later.", "error");
      });
  }

  // Functions to handle modal
  function openModal() {
      const modal = document.getElementById('completeRecordsModal');
      modal.style.display = 'block';
      loadCompleteRecords();
      showNotification("Complete records loaded.", "info");
  }

  function closeModal() {
      const modal = document.getElementById('completeRecordsModal');
      modal.style.display = 'none';
      showNotification("Closed complete records.", "info");
  }

  // Close the modal when clicking outside of the modal content
  window.onclick = function(event) {
      const modal = document.getElementById('completeRecordsModal');
      if (event.target == modal) {
          modal.style.display = 'none';
          showNotification("Closed complete records.", "info");
      }
  }

  // Expose functions to the global scope to allow inline onclicks to work
  window.recordFeeding = recordFeeding;
  window.deleteRecord = deleteRecord;
  window.openModal = openModal;
  window.closeModal = closeModal;

  // Initial load of records
  window.onload = loadRecords;
