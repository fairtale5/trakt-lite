<script lang="ts">
  // Prop will be defined based on the structure of a watched history item (movie or episode/show)
  // that has been processed to confirm it's unrated.
  export let item: any; // Replace 'any' with a proper type later

  function handleRate() {
    // TODO: Implement rating logic (will be part of a later plan step)
    alert(`Rating functionality for: ${item?.title || 'Item'}`);
  }
</script>

<!--
  This component will render a single unrated watched history item.
  It will display item details and a Call To Action (CTA) to rate it.
-->
<div>
  <h4>{item?.title || 'Item Title Placeholder'} ({item?.type || 'N/A'})</h4>
  <p>Watched: {item?.watched_at ? new Date(item.watched_at).toLocaleDateString() : 'N/A'}</p>
  <button on:click={handleRate}>Rate Item</button>
  <!-- Add more details as needed, like year or poster -->
</div>

<style>
  div {
    padding: 8px;
    border: 1px solid var(--shade-500); /* Example border */
    border-radius: 4px;
    margin-bottom: 8px;
  }
  button {
    margin-top: 4px;
    /* Basic styling, can be improved with Flowbite or global styles */
    padding: 4px 8px;
    background-color: var(--purple-500);
    color: var(--purple-50);
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  button:hover {
    background-color: var(--purple-700);
  }
</style>
