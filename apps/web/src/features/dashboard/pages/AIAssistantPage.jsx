import { useRef, useEffect, useState } from "react";
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

import { apiRequest } from "../../../services/apiService.js";

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

  const [inventorySummary, setInventorySummary] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
  
    const loadInventoryContext = async () => {
      try {
        const [products, stockoutRisks] = await Promise.all([
          apiRequest("/api/v1/inventory"),
          apiRequest("/api/v1/stockout-risks"),
        ]);
  
        if (!isMounted) return;
  
        setInventorySummary({
          total: Array.isArray(products) ? products.length : 0,
          attention: Number(stockoutRisks?.totalRisks ?? 0),
        });
      } catch (error) {
        console.error("Failed to load inventory context:", error);
      }
    };
  
    loadInventoryContext();
  
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const sendMessage = async (messageText = input) => {
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

    try {
      const data = await apiRequest("/api/v1/ai/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      });

      if (data.analysis) {
        setInventorySummary({
          total: data.analysis.totalProducts,
          attention:
            data.analysis.criticalCount +
            data.analysis.highRiskCount +
            data.analysis.mediumRiskCount,
        });
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            data.answer ||
            "The AI service returned an empty response.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `Sorry, I couldn't process your request. ${error.message}`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearConversation = () => {
    if (isThinking) return;

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

        <span className="demo-data-label">AI CONNECTED</span>
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
    <strong>{inventorySummary?.total ?? "—"}</strong>
  </div>

  <div>
    <span>Needs attention</span>
    <strong className="ai-attention-number">
      {inventorySummary?.attention ?? "—"}
    </strong>
  </div>
</div>

          <div className="ai-context-divider" />

          <h4>What I can help with</h4>

          <div className="ai-capability-list">
            <div>
              <Package size={15} />
              Inventory analysis
            </div>

            <div>
              <AlertTriangle size={15} />
              Stockout risk detection
            </div>

            <div>
              <TrendingUp size={15} />
              Reorder recommendations
            </div>

            <div>
              <Lightbulb size={15} />
              Operational insights
            </div>
          </div>

          <div className="ai-context-note">
            <Sparkles size={15} />
            <p>
              AI responses are generated using live inventory,
              stockout risk and purchase order data.
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
                  <i />
                  {isThinking ? "Thinking..." : "Ready to assist"}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ai-clear-button"
              onClick={clearConversation}
              disabled={isThinking}
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
                      disabled={isThinking}
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
                disabled={isThinking}
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
              EnterpriseOS AI · Powered by OpenAI
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}