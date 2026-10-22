# Order Lifecycle

Keep order, assignment and payment states separate. Pickup requires food readiness and an accepted rider. Completed orders must not expose current rider coordinates. Route calculation occurs outside a short transaction that validates and commits the plan.
