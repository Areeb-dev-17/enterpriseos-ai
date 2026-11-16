
from google.genai import types


inventory_tool = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="get_inventory",
            description=(
                "Fetch the current organization's inventory products, "
                "including product names, SKUs, available stock, "
                "reorder levels, and unit prices."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        ),
        types.FunctionDeclaration(
            name="get_stockout_risks",
            description=(
                "Fetch products that are currently at risk of stockout. "
                "Returns critical, high, and medium risk counts and products."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        ),
        types.FunctionDeclaration(
            name="get_open_purchase_orders",
            description=(
                "Fetch open purchase orders and incoming stock quantities "
                "that have not yet been received."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {},
                 "additionalProperties": False,
            },
        ),
    ]
)



# //open ai mai aise krenge

# tools = [
#     {
#         "type": "function",
#         "name": "get_inventory",
#         "description": "Fetch inventory products",
#         "parameters": {
#             "type": "object",
#             "properties": {},
#             "required": [],
#             "additionalProperties": False,
#         },
#         "strict": True,
#     }
# ]