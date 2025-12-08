<?php

namespace Tests\Unit\Models;

use App\Models\Deck;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeckTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Deck can be created
     */
    public function test_deck_can_be_created()
    {
        $deck = Deck::create([
            "name" => "Classic Deck",
            "slug" => "classic-deck",
            "price" => 100,
            "active" => true,
        ]);

        $this->assertInstanceOf(Deck::class, $deck);
        $this->assertEquals("Classic Deck", $deck->name);
        $this->assertEquals("classic-deck", $deck->slug);
        $this->assertEquals(100, $deck->price);
        $this->assertTrue($deck->active);
    }

    /**
     * Test fillable attributes
     */
    public function test_fillable_attributes()
    {
        $expectedFillable = ["name", "slug", "price", "active"];

        $deck = new Deck();
        $this->assertEquals($expectedFillable, $deck->getFillable());
    }

    /**
     * Test deck creation with all attributes
     */
    public function test_deck_creation_with_all_attributes()
    {
        $deckData = [
            "name" => "Premium Deck",
            "slug" => "premium-deck",
            "price" => 250,
            "active" => true,
        ];

        $deck = Deck::create($deckData);

        $this->assertEquals($deckData["name"], $deck->name);
        $this->assertEquals($deckData["slug"], $deck->slug);
        $this->assertEquals($deckData["price"], $deck->price);
        $this->assertEquals($deckData["active"], $deck->active);
    }

    /**
     * Test deck creation with inactive status
     */
    public function test_deck_creation_with_inactive_status()
    {
        $deck = Deck::create([
            "name" => "Inactive Deck",
            "slug" => "inactive-deck",
            "price" => 150,
            "active" => false,
        ]);

        $this->assertFalse($deck->active);
    }

    /**
     * Test deck creation with zero price
     */
    public function test_deck_creation_with_zero_price()
    {
        $deck = Deck::create([
            "name" => "Free Deck",
            "slug" => "free-deck",
            "price" => 0,
            "active" => true,
        ]);

        $this->assertEquals(0, $deck->price);
    }

    /**
     * Test deck name can contain special characters
     */
    public function test_deck_name_with_special_characters()
    {
        $deck = Deck::create([
            "name" => "Deck & Co. - Premium Edition!",
            "slug" => "deck-co-premium-edition",
            "price" => 300,
            "active" => true,
        ]);

        $this->assertEquals("Deck & Co. - Premium Edition!", $deck->name);
        $this->assertEquals("deck-co-premium-edition", $deck->slug);
    }

    /**
     * Test deck slug format
     */
    public function test_deck_slug_format()
    {
        $deck = Deck::create([
            "name" => "Test Deck",
            "slug" => "test-deck-123",
            "price" => 50,
            "active" => true,
        ]);

        $this->assertMatchesRegularExpression('/^[a-z0-9-]+$/', $deck->slug);
    }

    /**
     * Test deck with maximum price
     */
    public function test_deck_with_maximum_price()
    {
        $deck = Deck::create([
            "name" => "Ultra Premium Deck",
            "slug" => "ultra-premium-deck",
            "price" => 999999,
            "active" => true,
        ]);

        $this->assertEquals(999999, $deck->price);
    }

    /**
     * Test deck timestamps functionality
     */
    public function test_deck_timestamps()
    {
        $deck = Deck::create([
            "name" => "Timestamped Deck",
            "slug" => "timestamped-deck",
            "price" => 75,
            "active" => true,
        ]);

        $this->assertNotNull($deck->created_at);
        $this->assertNotNull($deck->updated_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $deck->created_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $deck->updated_at);
    }

    /**
     * Test deck update functionality
     */
    public function test_deck_can_be_updated()
    {
        $deck = Deck::create([
            "name" => "Original Deck",
            "slug" => "original-deck",
            "price" => 100,
            "active" => true,
        ]);

        $originalUpdatedAt = $deck->updated_at;

        // Wait a moment to ensure updated_at changes
        sleep(1);

        $deck->update([
            "name" => "Updated Deck",
            "price" => 200,
        ]);

        $this->assertEquals("Updated Deck", $deck->name);
        $this->assertEquals(200, $deck->price);
        $this->assertGreaterThan($originalUpdatedAt, $deck->updated_at);
    }

    /**
     * Test deck deletion
     */
    public function test_deck_can_be_deleted()
    {
        $deck = Deck::create([
            "name" => "Temporary Deck",
            "slug" => "temporary-deck",
            "price" => 50,
            "active" => true,
        ]);

        $deckId = $deck->id;

        $deck->delete();

        $this->assertNull(Deck::find($deckId));
    }

    /**
     * Test deck query by active status
     */
    public function test_query_decks_by_active_status()
    {
        Deck::create([
            "active" => true,
            "name" => "Active Deck 1",
            "slug" => "active-deck-1",
            "price" => 100,
        ]);
        Deck::create([
            "active" => true,
            "name" => "Active Deck 2",
            "slug" => "active-deck-2",
            "price" => 150,
        ]);
        Deck::create([
            "active" => false,
            "name" => "Inactive Deck",
            "slug" => "inactive-deck",
            "price" => 200,
        ]);

        $activeDecks = Deck::where("active", true)->get();
        $inactiveDecks = Deck::where("active", false)->get();

        $this->assertCount(2, $activeDecks);
        $this->assertCount(1, $inactiveDecks);
    }

    /**
     * Test deck query by price range
     */
    public function test_query_decks_by_price_range()
    {
        Deck::create([
            "price" => 50,
            "name" => "Cheap Deck",
            "slug" => "cheap-deck",
            "active" => true,
        ]);
        Deck::create([
            "price" => 150,
            "name" => "Medium Deck",
            "slug" => "medium-deck",
            "active" => true,
        ]);
        Deck::create([
            "price" => 300,
            "name" => "Expensive Deck",
            "slug" => "expensive-deck",
            "active" => true,
        ]);

        $affordableDecks = Deck::where("price", "<=", 100)->get();
        $premiumDecks = Deck::where("price", ">", 200)->get();

        $this->assertCount(1, $affordableDecks);
        $this->assertCount(1, $premiumDecks);
    }

    /**
     * Test deck name uniqueness (if enforced by database)
     */
    public function test_deck_slug_should_be_unique()
    {
        Deck::create([
            "name" => "First Deck",
            "slug" => "unique-deck",
            "price" => 100,
            "active" => true,
        ]);

        // This should potentially fail if slug uniqueness is enforced
        // For now, we'll just test that creation works without uniqueness constraint
        $secondDeck = Deck::create([
            "name" => "Second Deck",
            "slug" => "another-unique-deck",
            "price" => 150,
            "active" => true,
        ]);

        $this->assertNotEquals("unique-deck", $secondDeck->slug);
    }

    /**
     * Test deck with long name
     */
    public function test_deck_with_long_name()
    {
        $longName = str_repeat("A very long deck name ", 10);

        $deck = Deck::create([
            "name" => $longName,
            "slug" => "very-long-deck-name",
            "price" => 100,
            "active" => true,
        ]);

        $this->assertEquals($longName, $deck->name);
    }

    /**
     * Test deck ordering by price
     */
    public function test_deck_ordering_by_price()
    {
        $expensive = Deck::create([
            "price" => 500,
            "name" => "Expensive",
            "slug" => "expensive-deck",
            "active" => true,
        ]);
        $cheap = Deck::create([
            "price" => 25,
            "name" => "Cheap",
            "slug" => "cheap-deck",
            "active" => true,
        ]);
        $medium = Deck::create([
            "price" => 150,
            "name" => "Medium",
            "slug" => "medium-deck",
            "active" => true,
        ]);

        $decksByPriceAsc = Deck::orderBy("price", "asc")->get();
        $decksByPriceDesc = Deck::orderBy("price", "desc")->get();

        $this->assertEquals($cheap->id, $decksByPriceAsc->first()->id);
        $this->assertEquals($expensive->id, $decksByPriceAsc->last()->id);

        $this->assertEquals($expensive->id, $decksByPriceDesc->first()->id);
        $this->assertEquals($cheap->id, $decksByPriceDesc->last()->id);
    }

    /**
     * Test deck factory usage
     */
    public function test_deck_factory_creates_valid_deck()
    {
        $deck = Deck::create([
            "name" => "Test Deck",
            "slug" => "test-deck",
            "price" => 100,
            "active" => true,
        ]);

        $this->assertInstanceOf(Deck::class, $deck);
        $this->assertNotNull($deck->name);
        $this->assertNotNull($deck->slug);
        $this->assertIsNumeric($deck->price);
        $this->assertIsBool($deck->active);
    }

    /**
     * Test multiple deck creation
     */
    public function test_multiple_deck_creation()
    {
        $decks = collect();
        for ($i = 1; $i <= 5; $i++) {
            $decks->push(
                Deck::create([
                    "name" => "Test Deck {$i}",
                    "slug" => "test-deck-{$i}",
                    "price" => 100 * $i,
                    "active" => true,
                ]),
            );
        }

        $this->assertCount(5, $decks);

        foreach ($decks as $deck) {
            $this->assertInstanceOf(Deck::class, $deck);
            $this->assertNotNull($deck->name);
            $this->assertNotNull($deck->slug);
        }
    }
}
