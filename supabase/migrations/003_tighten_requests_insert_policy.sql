DROP POLICY IF EXISTS "Anyone can create requests" ON requests;
DROP POLICY IF EXISTS "Anyone can create pending unassigned requests" ON requests;

CREATE POLICY "Anyone can create pending unassigned requests" ON requests
    FOR INSERT WITH CHECK (status = 'pending' AND provider_id IS NULL);
