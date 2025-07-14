// test-add-group.js - Simple test for add group functionality

console.log('Testing add group functionality...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, looking for add-group-btn...');
    
    const addGroupBtn = document.getElementById('add-group-btn');
    
    if (addGroupBtn) {
        console.log('Add group button found!');
        
        addGroupBtn.addEventListener('click', function() {
            console.log('Add group button clicked!');
            
            // Simple alert test
            alert('Add Group button is working! This will be replaced with a proper modal.');
        });
    } else {
        console.log('Add group button NOT found!');
    }
});
