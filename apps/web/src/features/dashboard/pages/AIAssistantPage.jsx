import { useMemo, useRef, useEffect, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Package,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  User,
  Lightbulb,
} from "lucide-react";

import { initialInventoryData, getStockStatus } from "./components/InventoryTable";

const suggestions = [
  {
    icon: AlertTriangle,
    title: "Identify stock risks",
    prompt: "Which products are currently at risk of stockout?",
  },
  {
    icon: Package,
    title: "Inventory summary",
    prompt: "Give me a summary of my current inventory.",
  },
  {
    icon: TrendingUp,
    title: "Reorder recommendations",
    prompt: "Which products should I reorder and why?",
  },
  {
    icon: Lightbulb,
    title: "Business insights",
    prompt: "What are the most important inventory actions I should take?",
  },
];

function getInventoryInsights(question) {
  const query = question.toLowerCase();

  const products = initialInventoryData;
  const outOfStock = products.filter(
    (product) => product.availableStock === 0
  );
  const lowStock = products.filter(
    (product) =>
      product.availableStock > 0 &&
      product.availableStock <= product.reorderLevel
  );
  const inStock = products.filter(
    (product) =>
      product.availableStock > product.reorderLevel
  );

  if (
    query.includes("stockout") ||
    query.includes("risk") ||
    query.includes("low stock") ||
    query.includes("out of stock")
  ) {
    if (!lowStock.length && !outOfStock.length) {
      return "Good news! There are currently no products below their reorder levels.";
    }

    const outText = outOfStock.length
      ? `**Out of stock:** ${outOfStock
          .map((product) => product.productName)
          .join(", ")}.`
      : "";

    const lowText = lowStock.length
      ? `**Low stock:** ${lowStock
          .map(
            (product) =>
              `${product.productName} (${product.availableStock} units available, reorder level ${product.reorderLevel})`
          )
          .join("; ")}.`
      : "";

    return `${outText}\n\n${lowText}\n\nI recommend prioritizing the out-of-stock products first, followed by products below their reorder levels.`;
  }

  if (
    query.includes("reorder") ||
    query.includes("restock") ||
    query.includes("purchase")
  ) {
    const atRisk = [...outOfStock, ...lowStock];

    if (!atRisk.length) {
      return "All products are currently above their reorder levels. No immediate replenishment is indicated by this demo dataset.";
    }

    return `Based on the current inventory data, consider replenishing these products:\n\n${atRisk
      .map((product, index) => {
        const suggestedQuantity = Math.max(
          product.reorderLevel * 2 - product.availableStock,
          product.reorderLevel
        );

        return `${index + 1}. **${product.productName}** — available: ${product.availableStock}, reorder level: ${product.reorderLevel}, suggested quantity: approximately ${suggestedQuantity} units.`;
      })
      .join("\n\n")}\n\nThese are illustrative quantities based on a simple target-stock rule, not demand forecasts.`;
  }

  if (
    query.includes("summary") ||
    query.includes("inventory") ||
    query.includes("how many") ||
    query.includes("overview")
  ) {
    const totalUnits = products.reduce(
      (sum, product) => sum + product.availableStock,
      0
    );

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum + product.availableStock * product.unitPrice,
      0
    );

    return `Here's your inventory snapshot:\n\n- **Total products:** ${products.length}\n- **Total available units:** ${totalUnits.toLocaleString("en-IN")}\n- **In stock:** ${inStock.length} products\n- **Low stock:** ${lowStock.length} products\n- **Out of stock:** ${outOfStock.length} products\n- **Estimated stock value:** ₹${inventoryValue.toLocaleString("en-IN")}\n\nYour inventory has ${lowStock.length + outOfStock.length} products that need replenishment attention.`;
  }

  if (
    query.includes("action") ||
    query.includes("insight") ||
    query.includes("recommend") ||
    query.includes("should i")
  ) {
    const urgentProducts = [...outOfStock, ...lowStock];

    return `Here are the key actions based on your current inventory:\n\n1. **Resolve stockouts:** ${
      outOfStock.length
        ? outOfStock.map((product) => product.productName).join(", ")
        : "No products are currently out of stock."
    }.\n\n2. **Review low-stock products:** ${
      lowStock.length
        ? lowStock.map((product) => product.productName).join(", ")
        : "No products are currently below reorder level."
    }.\n\n3. **Review replenishment quantities:** Use recent sales and supplier lead times before raising purchase orders.\n\nThere are ${urgentProducts.length} products currently requiring attention.`;
  }

  const product = products.find(
    (item) =>
      query.includes(item.productName.toLowerCase()) ||
      query.includes(item.sku.toLowerCase())
  );

  if (product) {
    return `Here's the current status of **${product.productName}**:\n\n- **SKU:** ${product.sku}\n- **Category:** ${product.category}\n- **Available stock:** ${product.availableStock} units\n- **Reorder level:** ${product.reorderLevel} units\n- **Unit price:** ₹${product.unitPrice.toLocaleString("en-IN")}\n- **Status:** ${getStockStatus(
      product.availableStock,
      product.reorderLevel
    )}\n\n${
      product.availableStock <= product.reorderLevel
        ? "This product needs replenishment attention."
        : "This product is currently above its reorder level."
    }`;
  }

  return "I can help you analyze your inventory, identify stockout risks, review product availability, and suggest replenishment actions.\n\nTry asking about your inventory summary, low-stock products, reorder recommendations, or a specific product name or SKU.";
}

function formatMessage(text) {
  return text.split("\n").map((line, index) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);

    return (
      <span className="ai-message-line" key={index}>
        {parts.map((part, partIndex) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={partIndex}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={partIndex}>{part}</span>
          )
        )}
      </span>
    );
  });
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I'm your EnterpriseOS Inventory Assistant. I can help you understand stock levels, identify inventory risks, and recommend replenishment actions.\n\nWhat would you like to explore today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const inventorySummary = useMemo(() => {
    const total = initialInventoryData.length;
    const attention = initialInventoryData.filter(
      (product) =>
        product.availableStock <= product.reorderLevel
    ).length;

    return { total, attention };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = (messageText = input) => {
    const question = messageText.trim();

    if (!question || isThinking) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsThinking(true);

    // Simulated response for the frontend demo.
    window.setTimeout(() => {
      const response = getInventoryInsights(question);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: response,
        },
      ]);

      setIsThinking(false);
    }, 700);
  };

  const clearConversation = () => {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Conversation cleared. What would you like to know about your inventory?",
      },
    ]);
  };

  return (
    <div className="dashboard-overview ai-assistant-page">
      <div className="overview-heading">
        <div>
          <h2>AI Assistant</h2>
          <p>
            Ask questions, uncover inventory insights, and make smarter
            operational decisions.
          </p>
        </div>
        <span className="demo-data-label">DEMO MODE</span>
      </div>

      <div className="ai-assistant-layout">
        <aside className="ai-context-panel">
          <div className="ai-context-heading">
            <div className="ai-context-icon">
              <Sparkles size={19} />
            </div>
            <div>
              <h3>Inventory Context</h3>
              <p>Data available to assistant</p>
            </div>
          </div>

          <div className="ai-context-stats">
            <div>
              <span>Total products</span>
              <strong>{inventorySummary.total}</strong>
            </div>
            <div>
              <span>Needs attention</span>
              <strong className="ai-attention-number">
                {inventorySummary.attention}
              </strong>
            </div>
          </div>

          <div className="ai-context-divider" />

          <h4>What I can help with</h4>

          <div className="ai-capability-list">
            <div><Package size={15} /> Inventory analysis</div>
            <div><AlertTriangle size={15} /> Stockout risk detection</div>
            <div><TrendingUp size={15} /> Reorder recommendations</div>
            <div><Lightbulb size={15} /> Operational insights</div>
          </div>

          <div className="ai-context-note">
            <Sparkles size={15} />
            <p>
              Responses currently use the dashboard's sample inventory data.
            </p>
          </div>
        </aside>

        <section className="ai-chat-panel">
          <div className="ai-chat-header">
            <div className="ai-chat-agent">
              <div className="ai-agent-avatar">
                <Bot size={20} />
              </div>
              <div>
                <h3>Inventory Copilot</h3>
                <span>
                  <i /> Ready to assist
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ai-clear-button"
              onClick={clearConversation}
              title="Clear conversation"
            >
              <RotateCcw size={15} />
              <span>New chat</span>
            </button>
          </div>

          <div className="ai-messages">
            {messages.map((message) => (
              <div
                className={`ai-message ai-message-${message.role}`}
                key={message.id}
              >
                <div className="ai-message-avatar">
                  {message.role === "assistant" ? (
                    <Bot size={17} />
                  ) : (
                    <User size={17} />
                  )}
                </div>

                <div className="ai-message-content">
                  <span className="ai-message-author">
                    {message.role === "assistant" ? "Copilot" : "You"}
                  </span>
                  <div className="ai-message-bubble">
                    {formatMessage(message.content)}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-message-avatar">
                  <Bot size={17} />
                </div>
                <div className="ai-message-content">
                  <span className="ai-message-author">Copilot</span>
                  <div className="ai-message-bubble ai-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="ai-suggestions">
              <span>TRY ASKING</span>
              <div className="ai-suggestion-grid">
                {suggestions.map((suggestion) => {
                  const Icon = suggestion.icon;

                  return (
                    <button
                      type="button"
                      className="ai-suggestion-card"
                      key={suggestion.title}
                      onClick={() => sendMessage(suggestion.prompt)}
                    >
                      <Icon size={17} />
                      <span>{suggestion.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form
            className="ai-chat-input-area"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <div className="ai-chat-input-wrap">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything about your inventory..."
                aria-label="Message the inventory assistant"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </div>
            <p>
              <Sparkles size={12} />
              Demo assistant · Responses are generated from sample data
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}