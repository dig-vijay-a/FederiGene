Feature: System Health
  As a system monitor or load balancer
  I want to check the health of the API
  So that I know if the FederiGene backend is operational

  Scenario: Checking the health endpoint
    Given the API is running
    When I request the health status
    Then I should receive a healthy response
