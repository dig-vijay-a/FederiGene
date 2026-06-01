import os

filepath = 'c:/Users/digvi/OneDrive/Desktop/FederiGene/Backend/routes/platform_routes.py'
with open(filepath, 'r') as f:
    lines = f.readlines()

new_lines = lines[:430] + [
    '    # 3. Save the PyTorch weights locally for aggregation\n',
    '    temp_dir = "temp_weights"\n',
    '    if not os.path.exists(temp_dir):\n',
    '        os.makedirs(temp_dir)\n',
    '        \n',
    '    weight_path = os.path.join(temp_dir, f"job_{job_id}_org_{membership.org_id}_round_{job.current_round}.pt")\n',
    '    with open(weight_path, "wb") as f:\n',
    '        f.write(base64.b64decode(req.weights_b64))\n',
    '\n',
    '    # 4. Mark participant as submitted\n',
    '    participant.status = "submitted"\n',
    '    participant.hmac_hash = req.signature\n',
    '    if req.loss is not None:\n',
    '        participant.local_loss = req.loss\n',
    '    \n',
    '    db.add(AuditLog(\n',
    '        user_id=user.id, \n',
    '        org_id=membership.org_id, \n',
    '        action="training_update_submitted",\n',
    '        resource_type="training_job",\n',
    '        resource_id=job_id,\n',
    '        details=f"Round {job.current_round} weights received."\n',
    '    ))\n',
    '    db.commit()\n',
    '    \n',
    '    # 5. Trigger background check to see if all nodes have submitted\n',
    '    background_tasks.add_task(check_and_aggregate, job_id, db)\n',
    '    \n',
    '    return {"status": "success", "message": f"Weights received for round {job.current_round}. Verifying HMAC signature."}\n',
    '\n'
] + lines[520:]

with open(filepath, 'w') as f:
    f.writelines(new_lines)
print("File repaired successfully")
